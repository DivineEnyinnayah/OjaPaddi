"use client";

import { useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

function receiptNo() {
  // Stable-looking pseudo receipt number from the date
  const d = new Date();
  const y = String(d.getFullYear()).slice(2);
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `OA-${y}${m}${day}`;
}

function todayLabel() {
  return new Date().toLocaleDateString("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function WaitlistForm() {
  const [status, setStatus] = useState<Status>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [firstName, setFirstName] = useState("");

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (status === "submitting") return;

    const form = e.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const email = String(data.get("email") ?? "").trim();
    const honeypot = String(data.get("company") ?? "");

    if (honeypot) {
      setFirstName(name.split(" ")[0] ?? "");
      setStatus("success");
      return;
    }

    setStatus("submitting");
    setErrorMessage("");

    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      });

      if (res.status === 201) {
        setFirstName(name.split(" ")[0] ?? "");
        setStatus("success");
        return;
      }

      const payload = (await res.json().catch(() => null)) as
        | { error?: { code?: string; message?: string } }
        | null;

      if (res.status === 409) {
        setErrorMessage("This email already has a receipt issued. We'll be in touch at launch.");
      } else if (res.status === 429) {
        setErrorMessage("Whoa — one receipt at a time. Give it a minute.");
      } else if (res.status === 400 && payload?.error?.message) {
        setErrorMessage(payload.error.message);
      } else {
        setErrorMessage("The till is down. Try again in a moment.");
      }
      setStatus("error");
    } catch {
      setErrorMessage("Couldn't reach the till. Check your connection.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <div
        className="relative overflow-hidden rounded-lg border-2 border-paddi-700 bg-white p-6 font-mono text-[13px] leading-relaxed text-ink shadow-[6px_6px_0_rgba(0,82,50,0.18)]"
        role="status"
        aria-live="polite"
      >
        <p className="text-center font-bold tracking-widest text-paddi-800">
          EARLY ACCESS RECEIPT
        </p>
        <p className="mt-1 text-center text-ink-soft">RCPT #{receiptNo()} — PAID IN FULL</p>
        <div className="perf my-4" />
        <div className="space-y-1.5">
          <p className="flex justify-between"><span>Customer</span><span className="font-bold">{firstName || "Friend"}</span></p>
          <p className="flex justify-between"><span>Plan</span><span className="font-bold">FREE FOREVER</span></p>
          <p className="flex justify-between"><span>Amount</span><span className="font-bold">₦0.00</span></p>
          <p className="flex justify-between"><span>We&apos;ll email you</span><span>at launch 🎉</span></p>
        </div>
        <div className="perf my-4" />
        <div className="relative mx-auto mt-4 w-fit">
          <span className="block rounded-lg border-2 border-paddi-700 px-4 py-1 text-center text-sm font-bold tracking-[0.3em] text-paddi-700 stamp-anim">
            VALID
          </span>
        </div>
        <p className="mt-4 text-center text-[11px] text-ink-soft">
          Keep this receipt. It&apos;s your spot in line.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="relative overflow-hidden rounded-lg border border-ink/15 bg-white p-6 font-mono text-[13px] text-ink shadow-[6px_6px_0_rgba(0,82,50,0.15)]"
      aria-label="Get early access to OjaPaddi"
    >
      <p className="text-center text-xs font-bold tracking-[0.25em] text-paddi-800">
        OJAPADDI ENTERPRISE
      </p>
      <p className="mt-0.5 text-center text-xs text-ink-soft">EARLY ACCESS RECEIPT</p>
      <p className="mt-0.5 text-center text-[11px] text-ink-soft">
        RCPT #{receiptNo()} · {todayLabel()}
      </p>

      <div className="perf my-4" />

      <div className="space-y-1.5 text-[12px]">
        <p className="flex justify-between"><span>1× Early access pass</span><span>₦0.00</span></p>
        <p className="flex justify-between"><span>1× Free forever plan</span><span>₦0.00</span></p>
        <p className="flex justify-between"><span>1× WhatsApp sharing</span><span>₦0.00</span></p>
        <p className="flex justify-between"><span>1× 2-min setup</span><span>₦0.00</span></p>
        <div className="perf my-3" />
        <p className="flex justify-between text-[15px] font-bold">
          <span>TOTAL</span>
          <span>₦0.00 — FREE</span>
        </p>
      </div>

      <div className="perf my-4" />

      {status === "error" && (
        <div
          className="mb-3 rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-[11px] text-red-800"
          role="alert"
        >
          {errorMessage}
        </div>
      )}

      <div className="space-y-3">
        <div>
          <label htmlFor="name" className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            Customer name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            minLength={2}
            maxLength={100}
            autoComplete="name"
            placeholder="Mama Tope"
            className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 font-mono text-[13px] text-ink placeholder:text-ink/30 focus:border-paddi-700 focus:outline-none focus:ring-2 focus:ring-paddi-700/20"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-[11px] font-bold uppercase tracking-wider text-ink-soft">
            Email address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="mt-1 w-full rounded-lg border border-ink/20 bg-paper px-3 py-2.5 font-mono text-[13px] text-ink placeholder:text-ink/30 focus:border-paddi-700 focus:outline-none focus:ring-2 focus:ring-paddi-700/20"
          />
        </div>
      </div>

      {/* Honeypot — hidden from humans */}
      <div className="absolute -left-[9999px] top-auto" aria-hidden="true">
        <label htmlFor="company">Company</label>
        <input id="company" name="company" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <button
        type="submit"
        disabled={status === "submitting"}
        className="mt-5 w-full rounded-lg bg-paddi-800 px-5 py-3.5 font-mono text-[13px] font-bold uppercase tracking-widest text-paper transition hover:bg-paddi-700 active:scale-[0.96] disabled:cursor-not-allowed disabled:opacity-70"
      >
        {status === "submitting" ? "ISSUING…" : "ISSUE RECEIPT →"}
      </button>

      <p className="mt-3 text-center text-[10px] text-ink-soft">
        No card required · Free forever · We&apos;ll only email you at launch
      </p>
    </form>
  );
}
