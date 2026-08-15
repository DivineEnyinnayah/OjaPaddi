export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5">
      {/* Simple market stall / awning mark */}
      <svg
        width="32"
        height="32"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect
          x="1.5"
          y="1.5"
          width="29"
          height="29"
          rx="7"
          fill={dark ? "#0d4429" : "#0d4429"}
        />
        {/* awning stripes */}
        <path d="M5 12h22v5H5z" fill="#efb84e" />
        <path d="M5 17h22v2H5z" fill="#f6f1e7" />
        <path d="M5 12h4v7H5z" fill="#0d4429" />
        <path d="M14 12h4v7h-4z" fill="#0d4429" />
        <path d="M23 12h4v7h-4z" fill="#0d4429" />
        {/* counter */}
        <rect x="8" y="22" width="16" height="3" rx="1.5" fill="#f6f1e7" />
      </svg>
      <span
        className={`font-display text-lg font-bold tracking-tight ${
          dark ? "text-paper" : "text-paddi-900"
        }`}
      >
        OjaPaddi
      </span>
    </span>
  );
}
