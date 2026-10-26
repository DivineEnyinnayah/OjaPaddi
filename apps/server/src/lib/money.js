/**
 * Money helpers.
 *
 * Money columns are TEXT (SQLite has no decimal type, and REAL would silently
 * lose precision on currency). Every write goes through `money()` so values are
 * stored with exactly 2 decimal places instead of JS float noise like
 * "123.45000000000002".
 */
/** Normalises a numeric or numeric-string amount to a fixed 2dp string. */
export function money(value) {
    const n = Number(value ?? 0);
    return (Number.isFinite(n) ? n : 0).toFixed(2);
}
/** Same as `money()` but never negative — for balances that can't go below 0. */
export function moneyFloor0(value) {
    const n = Number(value ?? 0);
    return (Number.isFinite(n) && n > 0 ? n : 0).toFixed(2);
}
/** Reads a stored amount as a number. */
export function toNumber(value) {
    const n = Number(value ?? 0);
    return Number.isFinite(n) ? n : 0;
}
