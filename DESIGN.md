# OjaPaddi — Design System

**Version:** 2.0 · **Source of truth:** `ojapaddi-design.figcraft` (pages `00 Redesign — Cover` through `07 Redesign — States`)
**Status:** Implementation-ready for the Expo app.
**Audience:** Native app engineers, designers, QA.

The system is named **"The market is loud. The numbers shouldn’t be."** It is built for a busy market seller in Lagos: clear first, energetic second, never decorative before useful.

---

## 1. Principles

1. **Readable in sunlight.** Use contrast, weight and size before colour. No thin strokes, no microcopy under 11px.
2. **Receipt discipline.** Ledgers, references, amounts, and machine strings are always legible and aligned.
3. **One job per screen.** A screen either teaches the seller what happened, or asks for one decision. Never both.
4. **WhatsApp is checkout.** Sharing is a first-class action, not a share-icon afterthought.
5. **No fake certainty.** If data is stale, offline, partial, or plan-limited, say so — don’t silently round or fake-complete it.
6. **Market-first copy.** Nigerian English plain words. No jargon: say "owing", "stock", "till", "save", not "accounts receivable".

---

## 2. Colour tokens

Use these names in code. Do not invent Material colours in new work.

| Token | Light | Dark | Use |
|---|---|---|---|
| `background` | `#FAFAF7` | `#0F130F` | Page and large dead space |
| `card` | `#FFFFFF` | `#1D241F` | Cards, fields, lists, sheets |
| `ink` | `#14201C` | `#EAF0EC` | Primary text and icons |
| `muted` | `#5C6B66` | `#9AA6A0` | Secondary text, inactive icons |
| `brand` | `#1F6F5C` | `#79C7A0` | Primary action, focus, active tabs |
| `brandStrong` | `#154E40` | `#A7D9BE` | Hero card backgrounds, emphasis |
| `brandSoft` | `#E7F1EC` | `#17251D` | Quiet filled panels, borders on brand surfaces |
| `accent` | `#D97706` | `#F2B84B` | Money, cash, openings, highlighted values |
| `accentSoft` | `#FDE9C8` | `#332408` | Caution fills, payment prompts |
| `mint` | `#A7D9BE` | `#A7D9BE` | Text on `brandStrong` / dark focus chips |
| `danger` | `#B42318` | `#FF8A7A` | Destructive, stockout, erasing |
| `dangerSoft` | `#FDE8E4` | `#331B19` | Error fields, destructive hover |
| `border` | `#E4E2DA` | `#262D29` | Hairlines and input strokes |

### Rules

- `brandStrong` is for one hero card per screen only.
- Never put `ink` text on `brand` or `accent`; use `card` on `brand` and `#14201C` on `accent`.
- Never use `accent` for ordinary headings; it is reserved for money, dates, cash, and warnings.
- On dark screens, `border` stays nearly invisible; use `card` + low-opacity tint instead of hard strokes.
- Danger is only for irreversible/unpaid/out-of-stock. Don’t use it for "empty" or "zero" states.

---

## 3. Typography

### Font roles

| Role | Family | Purpose |
|---|---|---|
| `logo` | **League Spartan** Black | App logo and wordmark imagery only; app never re-types the wordmark |
| `display` | **League Spartan** ExtraBold | Splash hero, Store name, big numbers |
| `title` | **League Spartan** Bold | Screen titles, section heads |
| `body` | **Hanken Grotesk** Regular/Medium | Paragraphs, rows, body, helper copy |
| `label` | **Hanken Grotesk** SemiBold/Bold | Small labels, buttons, chips |
| `ledger` | **IBM Plex Mono** Regular/Medium | References, SKUs, receipt refs, barcode lines, totals on receipt |

### Scale

| Token | Size / line | Weight | Use |
|---|---|---|---|
| `display` | 48 / 46 (44 on short screens) | XB | Splash + launch rows only |
| `hero` | 34 / 36 | XB | Main H1, one per screen |
| `title` | 26 / 30 | XB | Screen title bar |
| `section` | 22 / 28 | B | Section heading |
| `card-title` | 18 / 24 | B | Row, card, list item title |
| `body` | 16 / 24 | R | Body copy |
| `body-sm` | 14 / 21 | R | Secondary body |
| `label` | 12 / 16 | 600 | Labels, chips, buttons |
| `micro` | 11 / 16 | 600 | Badges, captions |
| `ledger` | 12 / 16 or 14 / 18 | IBM Plex Mono Regular | Receipt; never use for body |

### Implementation

- Load all three families with `expo-font` and `useFonts()`.
- If a font fails to load, keep Hanken Grotesk; show nothing until loading resolves on cold start.
- All numeric strings use tabular figures (`tnum`) for alignment.
- Uppercase labels: letter spacing **+2%** minimum.
- League Spartan is never below **18px**.

---

## 4. Layout & spacing

### Unit system

```
4px base grid
screen padding: 24 horizontal
card padding: 16 vertical / 16–20 horizontal
radius: cards 18 · buttons/inputs 14 · app icon 24–28 · pill 999
height: controls 48 · primary button 56 · list rows 64 · tab bar 68
```

### Screen budgets

- The 390 × 844 design assumes about **640pt of usable content height** after status bar, header, and tab bar.
- Never require more than one scroll on a primary screen.
- Avoid two equal-width scroll areas.

### Responsive breakpoints

| Breakpoint | Min width | Rule |
|---|---|---|
| `xs` | 320 | 20px gutters · 14px buttons · single column only |
| `base` | 390 | Source of truth · 24px gutters |
| `lg` | 428 | Same layout, more whitespace only |
| `tablet` | ≥768 | Two-column for lists; tab bar becomes left rail; two side-by-side columns |

**Responsiveness is mandatory:**

- No fixed widths in JSX/styles except images and app-icon preview constraints.
- Container widths: `100%`, `w-full`, flex ratios; rows never use hard `width` except chips.
- All cards use `flex: 1`, min/max constraints for readability (max text measure 42–52ch).
- Typos: use `maxFontSizeMultiplier` capped at 1.3 for critical layouts; allow larger text for paragraphs.
- Keyboard: use `KeyboardAvoidingView` + `ScrollView`; all form screens must keep primary action visible.
- RTL: treat `start/end`, not left/right, for all padding/margins.
- Safe areas: respect `useSafeAreaInsets()`; tab bar height + bottom inset only on tab screens.
- On small screens, reduce paddings and vertical gaps before reducing type sizes.
- On large screens/tablets, increase whitespace, not content density.

---

## 5. Component inventory

### Buttons

```text
Primary   brand fill, white text, 56px, one verb: Pay, Save, Send, Open
Secondary white fill, brand border, ink text
Ghost     no fill, muted or brand text; never for destructive
Destructive brandStrong/danger fill, white text
```

- Icons: leading glyph + label, or icon-only only on utility actions (scan, close, share).
- Labels are short; never two-line primary buttons.

### Fields

```text
Default   white card, brand/outline stroke, 54–56px
Focus     white card, brand stroke, no shadow glow
Error     dangerSoft fill + danger stroke, one helper line only
Helper    below field, one line max; never both helper and error
```

### Cards

- **Hero card** — `brandStrong`, white/mint type, one screen per flow.
- **Metric card** — white, hairline `border`, 18px radius.
- **Action row** — white, glyph left, chevron right; tap target ≥48px.
- **Receipt card** — dashed/paper look with mono lines and explicit total.

### Chips & segmented controls

- Pill chips for filters: `All`, `Cash`, `Owing`, `Done`.
- Active chip uses `brand` fill + white text; never just tint differences.
- Every horizontal chip row may wrap on `xs`; use `flexWrap`.

### Logo and icon

- Use supplied assets, never redraw:
  - App icon: `apps/native/assets/images/OjaPaddi.png`
  - Lockup: `apps/native/assets/images/OjaPaddi(1).png`
- On busy backgrounds use the mark on a `card`-coloured rounded square; never on brand fill.
- Lockup: width ≈ 3.93× height; keep clear space ≥ height of coral dot.

---

## 6. Screen map

| Screen | Purpose | Primary action |
|---|---|---|
| `00` Cover | Redesign summary and where to start | open design |
| `01` Design System | Colors/type/components/brand boards | — |
| `02` Auth & Onboarding | Welcome, sign-in, create stall, verify, first product | `Open your stall` |
| `03` Home & Stock | Home dashboard; stock list; product detail; add/edit product | `Record sale` |
| `04` POS & Receipt | Checkout; receipt with share action | `Settle receipt` |
| `05` Sales, Customers, Expenses | Sales history; customer ledger; expenses | sell/record |
| `06` Insights & More | Insights; public store preview; plan/settings | share or dispute |
| `07` States | Loading, empty, no-match, offline, limit reached | recover |

### Required states for every screen

- **Loading:** skeleton, not spinner-only.
- **Empty:** one sentence + one action + optional illustration.
- **Error:** what failed + what to do next; no stack traces, no "something went wrong" on user-facing surfaces.
- **Offline:** visible status; queued writes; non-blocking for existing data.
- **Plan limit:** show the exact limit and one upgrade path; never silently clip data.

---

## 7. Accessibility & QA

- Body text contrast ≥ 4.5:1; large text ≥ 3:1.
- Touch targets ≥ 48×48px with ≥8px spacing.
- Every icon needs `accessibilityLabel` when not decorative; decorative glyphs `accessibilityElementsHidden`.
- No information in colour alone: overdue = colour + text (e.g. "Overdue").
- Status bar adapts to theme; white status bar on `brandStrong` splash.
- Reduced motion: no parallax, no pulsing skeletons beyond fade.
- `prefers-reduced-motion` must map to instant reveals or simple fades.

---

## 8. Implementation rules for Expo

- Load fonts before first render; show neutral warm background until loaded; never render fallback text first.
- Use `useThemeColor()` for React Native props; semantic classes for `uniwind` views.
- Migrate old Material/`global.css` tokens to this spec; do not ship both systems.
- Do not hard-code `#2e8b57`, `hanken`, `letterSpacing: 0.05`, arbitrary widths/heights, or one-off shadows.
- Keep `apps/native/constants/typography.ts` and `global.css` in sync with this file; either is the same contract.
- Add package deps only as needed:
  - `@expo-google-fonts/league-spartan`
  - `@expo-google-fonts/ibm-plex-mono`
  - keep `@expo-google-fonts/hanken-grotesk`
- Test font loading on cold start, offline, and app backgrounded.
- Verify on 320px, 390px, 428px, and tablet width ≥768px.

---

## 9. Non-goals

- No new business logic; this is visual and layout.
- No server changes; no DB migrations; no API changes.
- No recreating the logo image; use assets as-is.
- No mixed legacy Material colours or stale "brand green" from the previous system unless intentionally aliased for migration.

---

## 10. Hand-off checklist

- [ ] Fonts load before first paint.
- [ ] `DESIGN.md`, `typography.ts`, `global.css` agree.
- [ ] Every screen uses `background`, `ink`, `border`, `muted`, `brand`, `brandStrong`, `brandSoft`, `accent`, `accentSoft`, `danger`, `dangerSoft` only.
- [ ] All touch targets ≥48px.
- [ ] All screens scroll safely with keyboard up.
- [ ] Small screen verified at 320px; large screen at 428px and tablet.
- [ ] Offline, empty, loading, error, limit states present.
- [ ] No clipped tab bars or cut-off CTAs on small screens.
- [ ] No new arbitrary values.
