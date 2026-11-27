export type BookingRules = { slotMinutes: number; openTime: string; closeTime: string; closedDays: number[] };

const toMin = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
};

export function formatTime(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ap}`;
}

/** e.g. 07:30-16:30 every 30 min -> ["7:30 AM", ..., "4:30 PM"] */
export function buildSlots(rules: BookingRules): string[] {
  const out: string[] = [];
  const step = Math.max(5, rules.slotMinutes);
  for (let t = toMin(rules.openTime); t <= toMin(rules.closeTime); t += step) out.push(formatTime(t));
  return out;
}

export function isClosedDay(rules: BookingRules, isoDate: string) {
  const d = new Date(`${isoDate}T12:00:00Z`);
  return rules.closedDays.includes(d.getUTCDay());
}

/** Exact closures use YYYY-MM-DD; annual closures use *-MM-DD. */
export function isValidDisabledDateRule(value: string): boolean {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const date = new Date(`${value}T12:00:00Z`);
    return Number.isFinite(date.valueOf()) && date.toISOString().slice(0, 10) === value;
  }
  if (/^\*-\d{2}-\d{2}$/.test(value)) {
    const monthDay = value.slice(2);
    const date = new Date(`2000-${monthDay}T12:00:00Z`);
    return Number.isFinite(date.valueOf()) && date.toISOString().slice(5, 10) === monthDay;
  }
  return false;
}

export function isDisabledBookingDate(isoDate: string, rules: readonly string[] = []): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate)) return false;
  return rules.includes(isoDate) || rules.includes(`*-${isoDate.slice(5)}`);
}
