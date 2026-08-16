import { Logo } from "@/components/logo";
import { WaitlistForm } from "@/components/waitlist-form";
import { Marquee } from "@/components/marquee";

const FEATURES = [
  {
    code: "STK-01",
    name: "Stock that tells you the truth",
    desc: "See what's selling and what's running low — before the customer asks. No more guessing from memory.",
  },
  {
    code: "SAL-02",
    name: "Sales recorded in seconds",
    desc: "Tap, done. Every sale updates stock and profit automatically. Receipts included, always.",
  },
  {
    code: "WTA-03",
    name: "WhatsApp is your shop window",
    desc: "Send your store link, product cards and receipts straight into customers' chats.",
  },
  {
    code: "SET-04",
    name: "Set up in under 2 minutes",
    desc: "No manual, no training, no tech support line. If you can use WhatsApp, you can use OjaPaddi.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "Get your receipt",
    desc: "Drop your name and email. Takes 10 seconds, costs ₦0.00.",
  },
  {
    n: "02",
    title: "We open the doors",
    desc: "Early-access folks get in first — in the order they signed up.",
  },
  {
    n: "03",
    title: "Run your market like a boss",
    desc: "Stock, sales, WhatsApp — all in one place. Free forever.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="relative z-20 mx-auto flex max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Logo />
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 pb-16 pt-8 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:pt-14">
          <div>
            <p className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-marigold-600">
              Oja · Shop · Store — one app
            </p>
            <h1 className="mt-4 font-display text-5xl font-bold leading-[1.02] tracking-tight text-paddi-900 sm:text-6xl lg:text-7xl">
              Your market,
              <br />
              in your
              <span className="text-paddi-600"> pocket.</span>
            </h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-ink-soft">
              OjaPaddi is the simple business app for Nigerian market sellers.
              Track stock, record sales, share on WhatsApp — and never pay a
              kobo for it.
            </p>

            <ul className="mt-8 space-y-2.5 font-mono text-[13px] text-ink">
              {["Free forever — real features, not a trial", "Under 2-minute setup", "Works on any mid-range Android"].map(
                (item) => (
                  <li key={item} className="flex items-center gap-2.5">
                    <span className="text-paddi-600" aria-hidden="true">✔</span>
                    {item}
                  </li>
                )
              )}
            </ul>
          </div>

          <div id="join" className="scroll-mt-8 lg:justify-self-end">
            <WaitlistForm />
          </div>
        </section>

        <Marquee />

        {/* Features — as receipt lines */}
        <section className="mx-auto max-w-6xl px-5 py-20 sm:px-8 lg:py-28" aria-labelledby="features-heading">
          <div className="flex items-baseline justify-between border-b-2 border-ink/15 pb-4">
            <h2 id="features-heading" className="font-display text-3xl font-bold tracking-tight text-paddi-900 sm:text-4xl">
              What&apos;s on the menu
            </h2>
            <span className="hidden font-mono text-xs uppercase tracking-widest text-ink-soft sm:block">
              Itemised · no hidden charges
            </span>
          </div>

          <ul className="mt-8 divide-y divide-ink/10">
            {FEATURES.map((f) => (
              <li key={f.code} className="group grid gap-1 py-6 transition hover:bg-white/50 sm:grid-cols-[140px_1fr_auto] sm:gap-6 sm:px-4">
                <span className="font-mono text-xs font-bold tracking-widest text-marigold-600 sm:pt-1">
                  {f.code}
                </span>
                <div>
                  <h3 className="font-display text-xl font-bold text-ink">{f.name}</h3>
                  <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-ink-soft">{f.desc}</p>
                </div>
                <span className="hidden font-mono text-xs font-bold text-paddi-600 sm:block sm:pt-1">
                  ₦0.00
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Steps — queue tickets */}
        <section className="bg-paddi-900 py-20 lg:py-28" aria-labelledby="steps-heading">
          <div className="mx-auto max-w-6xl px-5 sm:px-8">
            <h2 id="steps-heading" className="font-display text-3xl font-bold tracking-tight text-paper sm:text-4xl">
              How you get in
            </h2>
            <ol className="mt-10 grid gap-6 md:grid-cols-3">
              {STEPS.map((s) => (
                <li
                  key={s.n}
                  className="rounded-lg border border-paper/15 bg-paper/5 p-6 backdrop-blur-sm transition hover:border-marigold-400/50 hover:bg-paper/10"
                >
                  <span className="font-mono text-4xl font-bold text-marigold-400">#{s.n}</span>
                  <h3 className="mt-4 font-display text-lg font-bold text-paper">{s.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-paper/60">{s.desc}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Closing CTA */}
        <section className="mx-auto max-w-3xl px-5 py-24 text-center sm:px-8">
          <h2 className="font-display text-4xl font-bold tracking-tight text-paddi-900 sm:text-5xl">
            The market doesn&apos;t wait. Neither should you.
          </h2>
          <p className="mx-auto mt-5 max-w-md text-lg leading-relaxed text-ink-soft">
            Get your early-access receipt now. First in line, first to sell.
          </p>
          <a
            href="#join"
            className="mt-9 inline-flex items-center gap-2 rounded-lg bg-paddi-800 px-8 py-4 font-mono text-[13px] font-bold uppercase tracking-widest text-paper shadow-[4px_4px_0_rgba(240,128,128,0.9)] transition hover:translate-y-0.5 hover:shadow-[2px_2px_0_rgba(240,128,128,0.9)] active:scale-[0.96]"
          >
            Get early access ↑
          </a>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-ink/10 bg-paper-2">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 sm:flex-row sm:px-8">
          <Logo />
          <p className="font-mono text-xs text-ink-soft">
            Your Market Friend — Manage, Sell &amp; Grow Your Business.
          </p>
          <p className="font-mono text-xs text-ink/50">© {new Date().getFullYear()} OjaPaddi</p>
        </div>
      </footer>
    </div>
  );
}
