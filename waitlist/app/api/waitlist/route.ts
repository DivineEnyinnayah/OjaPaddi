import { NextResponse } from "next/server";
import { waitlistSchema } from "@/lib/waitlist/schema";
import { getBackend } from "@/lib/waitlist";

// Simple in-memory rate limit: 10 signups per minute per IP.
// Good enough for a waitlist; swap for Upstash/Redis if it ever needs more.
const RATE_LIMIT = 10;
const RATE_WINDOW_MS = 60_000;
const hits = new Map<string, { count: number; resetAt: number }>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = hits.get(ip);
  if (!entry || entry.resetAt <= now) {
    hits.set(ip, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > RATE_LIMIT;
}

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: { code: "TOO_MANY_REQUESTS", message: "Slow down a little." } },
      { status: 429 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_JSON",
          message: "Request body must be valid JSON.",
        },
      },
      { status: 400 }
    );
  }

  const parsed = waitlistSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue?.message ?? "Invalid input.",
        },
      },
      { status: 400 }
    );
  }

  const { name, email, company } = parsed.data;

  // Honeypot triggered — bot. Pretend success, store nothing.
  if (company) {
    return NextResponse.json({ ok: true }, { status: 201 });
  }

  try {
    const backend = getBackend();

    if (await backend.hasEmail(email)) {
      return NextResponse.json(
        {
          error: {
            code: "ALREADY_REGISTERED",
            message: "This email is already on the waitlist.",
          },
        },
        { status: 409 }
      );
    }

    await backend.append({
      name,
      email,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (err) {
    console.error("Waitlist signup failed:", err);
    return NextResponse.json(
      {
        error: {
          code: "STORAGE_ERROR",
          message: "Something went wrong. Please try again in a moment.",
        },
      },
      { status: 500 }
    );
  }
}
