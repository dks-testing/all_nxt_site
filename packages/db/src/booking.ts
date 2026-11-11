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
