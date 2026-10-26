/**
 * Transactional email delivery, used for password-reset codes.
 *
 * Speaks HTTPS via `fetch` rather than SMTP. That matters: Cloudflare Workers
 * has no outbound raw TCP, so an SMTP transport (Nodemailer, etc.) cannot run
 * there at all. HTTP works on Workers, Node, and anything else.
 *
 * Currently Resend — it needs only an API key and a from address, with no SDK.
 * To move to Postmark/Mailgun/SendGrid, change `sendEmail()` and nothing else:
 * the reset flow only depends on this signature.
 *
 * Throws on failure. A silently dropped email locks the user out, because the
 * reset code is the only thing that lets a migrated account set a password.
 */

import { env } from "@ojapaddi/env/server";

export interface EmailMessage {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

export async function sendEmail(message: EmailMessage): Promise<void> {
  console.log(`[EMAIL] Attempting to send email to ${message.to} via Resend...`);
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.EMAIL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [message.to],
      subject: message.subject,
      text: message.text,
      ...(message.html ? { html: message.html } : {}),
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    console.error(`[EMAIL] Failed to send email to ${message.to}. Status: ${res.status}, Detail: ${detail}`);
    throw new Error(
      `Email provider returned ${res.status}${detail ? `: ${detail.slice(0, 200)}` : ""}`
    );
  }
  console.log(`[EMAIL] Successfully sent email to ${message.to}`);
}