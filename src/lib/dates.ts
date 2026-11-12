export const APP_TIMEZONE = "Asia/Kolkata";
export const SCHEME_MONTHS = 11;

export function kolkataToday(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: APP_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

export function parseISODate(iso: string): { y: number; m: number; d: number } {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) throw new Error(`Invalid date: ${iso}`);
  return { y: Number(match[1]), m: Number(match[2]), d: Number(match[3]) };
}

export function formatISODate(y: number, m: number, d: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function isISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const { y, m, d } = parseISODate(value);
  if (m < 1 || m > 12 || d < 1) return false;
  return d <= daysInMonth(y, m);
}

/** Installment index 0 is the start date. Later months keep the original day. */
export function dueDateForInstallment(startISO: string, installmentIndex: number): string {
  const { y, m, d } = parseISODate(startISO);
  const zeroBased = m - 1 + installmentIndex;
  const year = y + Math.floor(zeroBased / 12);
  const month = (zeroBased % 12) + 1;
  const day = Math.min(d, daysInMonth(year, month));
  return formatISODate(year, month, day);
}

export function buildDueDates(startISO: string, count = SCHEME_MONTHS): string[] {
  return Array.from({ length: count }, (_, index) => dueDateForInstallment(startISO, index));
}

export function toDateOnly(iso: string): Date {
  return new Date(`${iso}T00:00:00.000Z`);
}

export function fromDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function addDays(iso: string, days: number): string {
  const { y, m, d } = parseISODate(iso);
  const utc = new Date(Date.UTC(y, m - 1, d + days));
  return formatISODate(utc.getUTCFullYear(), utc.getUTCMonth() + 1, utc.getUTCDate());
}

export function startOfWeekMonday(iso: string): string {
  const { y, m, d } = parseISODate(iso);
  const utc = new Date(Date.UTC(y, m - 1, d));
  const weekday = utc.getUTCDay();
  const diff = weekday === 0 ? 6 : weekday - 1;
  return addDays(iso, -diff);
}

export function startOfMonth(iso: string): string {
  const { y, m } = parseISODate(iso);
  return formatISODate(y, m, 1);
}

export function endOfMonth(iso: string): string {
  const { y, m } = parseISODate(iso);
  return formatISODate(y, m, daysInMonth(y, m));
}

export function startOfYear(iso: string): string {
  return formatISODate(parseISODate(iso).y, 1, 1);
}

export function endOfYear(iso: string): string {
  return formatISODate(parseISODate(iso).y, 12, 31);
}

export type DateRangePreset = "today" | "week" | "month" | "year" | "custom";

export function rangeForPreset(
  preset: DateRangePreset,
  today = kolkataToday(),
  customFrom?: string,
  customTo?: string,
): { from: string; to: string } {
  if (preset === "today") return { from: today, to: today };
  if (preset === "week") {
    const from = startOfWeekMonday(today);
    return { from, to: addDays(from, 6) };
  }
  if (preset === "month") return { from: startOfMonth(today), to: endOfMonth(today) };
  if (preset === "year") return { from: startOfYear(today), to: endOfYear(today) };
  const from = customFrom && isISODate(customFrom) ? customFrom : today;
  const to = customTo && isISODate(customTo) ? customTo : today;
  return from <= to ? { from, to } : { from: to, to: from };
}

export function eachDate(from: string, to: string): string[] {
  const dates: string[] = [];
  let cursor = from;
  while (cursor <= to && dates.length < 400) {
    dates.push(cursor);
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function formatTimestamp(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: APP_TIMEZONE,
  }).format(date);
}

export function formatDisplayDate(iso: string): string {
  const { y, m, d } = parseISODate(iso);
  return new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

export function formatMonthLabel(iso: string): string {
  const { y, m } = parseISODate(`${iso.slice(0, 7)}-01`);
  return new Intl.DateTimeFormat("en-IN", {
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, 1)));
}

export type InstallmentDisplayStatus = "paid" | "overdue" | "due" | "upcoming";

export function installmentDisplayStatus(
  dueISO: string,
  isPaid: boolean,
  todayISO = kolkataToday(),
): InstallmentDisplayStatus {
  if (isPaid) return "paid";
  if (dueISO < todayISO) return "overdue";
  if (dueISO === todayISO) return "due";
  return "upcoming";
}
