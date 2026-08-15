const ITEMS = [
  "MAMA T'S SHOE PARLOUR",
  "CLOTH & FABRIC",
  "PHONE ACCESSORIES",
  "GARRI & PROVISIONS",
  "BAGS & BELTS",
  "RICE & SPICES",
  "JEWELLERY",
  "FROZEN FOODS",
  "ANKARA & LACE",
];

export function Marquee() {
  const row = [...ITEMS, ...ITEMS]; // duplicated for seamless loop
  return (
    <div
      className="relative overflow-hidden border-y border-ink/10 bg-paddi-900 py-3.5"
      aria-hidden="true"
    >
      <div className="marquee-track flex w-max items-center gap-8 whitespace-nowrap">
        {row.map((item, i) => (
          <span key={i} className="flex items-center gap-8">
            <span className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-paper/80">
              {item}
            </span>
            <span className="text-marigold-400">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
