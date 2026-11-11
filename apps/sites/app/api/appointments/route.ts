import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb, appointments, resolveHost, resolveSiteSlug, getSiteBundle } from "@platform/db";
import { sendEmail, sendSms } from "@/lib/notify";
import { validateExtraFields } from "@platform/db/booking-fields";
import { buildSlots } from "@platform/db/booking";

export const dynamic = "force-dynamic";

const schema = z.object({
  siteSlug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).optional(),
  customerName: z.string().trim().min(1).max(191),
  phone: z.string().trim().min(7).max(40),
  email: z.union([z.literal(""), z.string().trim().email().max(191)]).optional(),
  contactPref: z.enum(["phone", "text", "email"]).default("phone"),
  plate: z.string().trim().max(16).optional(),
  state: z.string().trim().max(2).optional(),
  vin: z.string().trim().max(17).optional(),
  year: z.string().trim().max(4).optional(),
  make: z.string().trim().max(64).optional(),
  model: z.string().trim().max(64).optional(),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional().or(z.literal("")),
  slot: z.string().max(32).optional(),
  dropOff: z.enum(["drop_off", "wait"]).default("drop_off"),
  issue: z.string().max(500).optional(),
  extraFields: z.record(z.string(), z.union([z.string(), z.boolean()])).optional(),
  website: z.string().optional(), // honeypot
});

// Basic per-IP throttle (per instance). Use Upstash/Redis rate limiting in production at scale.
const hits = new Map<string, number[]>();
function limited(ip: string) {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 10 * 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 5;
}

function replaceTokens(template: string, tokens: Record<string, string>) {
  return template.replace(/\{\{([a-z_]+)\}\}/g, (match, key: string) => tokens[key] ?? match);
}

export async function POST(req: Request) {
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "";
  const payload = await req.json().catch(() => ({}));
  const isLocal = process.env.NODE_ENV === "development" && /^(?:localhost|127\.0\.0\.1)(?::\d+)?$/.test(host);
  const site = isLocal && typeof payload?.siteSlug === "string"
    ? await resolveSiteSlug(payload.siteSlug)
    : await resolveHost(host);
  if (!site || site.status !== "PUBLISHED") return NextResponse.json({ error: "Site not found" }, { status: 404 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  if (limited(`${site.siteId}:${ip}`)) return NextResponse.json({ error: "Too many requests. Please call us instead." }, { status: 429 });

  if (Number(req.headers.get("content-length") || 0) > 24_000) return NextResponse.json({ error: "Request too large" }, { status: 413 });
  const parsed = schema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Please check the form and try again.", issues: parsed.error.issues }, { status: 400 });
  const d = parsed.data;
  if (d.website) return NextResponse.json({ ok: true }); // bot

  const bundle = await getSiteBundle(site.siteId);
  if (bundle?.booking && !bundle.booking.enabled) return NextResponse.json({ error: "Online booking is turned off" }, { status: 403 });
  let extraFields: Record<string, string | boolean>;
  try { extraFields = validateExtraFields(bundle?.booking?.formFields ?? [], d.extraFields ?? {}); }
  catch (e) { return NextResponse.json({ error: e instanceof Error ? e.message : "Invalid booking answers" }, { status: 400 }); }
  if (!d.plate && !(d.year && d.make && d.model)) return NextResponse.json({ error: "Enter a license plate or year, make and model" }, { status: 400 });
  if (d.contactPref === "email" && !d.email) return NextResponse.json({ error: "Email required for email contact" }, { status: 400 });
  if (!d.preferredDate) return NextResponse.json({ error: "Choose a date" }, { status: 400 });
  const start = new Date(`${d.preferredDate}T12:00:00Z`);
  if (!Number.isFinite(start.valueOf()) || start.toISOString().slice(0, 10) !== d.preferredDate) return NextResponse.json({ error: "Invalid date" }, { status: 400 });
  const booking = bundle?.booking;
  const min = new Date(); min.setUTCHours(0, 0, 0, 0); min.setUTCDate(min.getUTCDate() + (booking?.leadDays ?? 0));
  if (start < min || (booking?.closedDays ?? [0, 6]).includes(start.getUTCDay()) || (booking?.disabledDates ?? []).includes(d.preferredDate)) return NextResponse.json({ error: "Choose an available date" }, { status: 400 });
  const validSlots = buildSlots({ slotMinutes: booking?.slotMinutes ?? 30, openTime: booking?.openTime ?? "08:00", closeTime: booking?.closeTime ?? "16:30", closedDays: booking?.closedDays ?? [0, 6] });
  if (d.slot && d.slot !== "Soonest available" && !validSlots.includes(d.slot)) return NextResponse.json({ error: "Choose an available time" }, { status: 400 });

  const id = crypto.randomUUID();
  const vehicle = { plate: d.plate, state: d.state, vin: d.vin, year: d.year, make: d.make, model: d.model };
  await getDb().insert(appointments).values({
    id,
    siteId: site.siteId,
    customerName: d.customerName,
    phone: d.phone,
    email: d.email || null,
    contactPref: d.contactPref,
    vehicle,
    preferredDate: d.preferredDate || null,
    slot: d.slot ?? null,
    dropOff: d.dropOff,
    issue: d.issue ?? null,
    extraFields,
  });

  const car = d.plate ? `${d.plate} (${d.state ?? ""})` : [d.year, d.make, d.model].filter(Boolean).join(" ");
  const answers = Object.entries(extraFields).map(([k, v]) => `${k}: ${String(v)}`).join("\n");
  const settings = bundle?.settings;
  const address = settings?.address ? [settings.address.street, settings.address.city, settings.address.region, settings.address.postalCode].filter(Boolean).join(", ") : "";
  const hours = (settings?.hours ?? []).map((row) => `${row.day}: ${row.closed ? "Closed" : `${row.open ?? ""}–${row.close ?? ""}`}`).join(", ");
  const tokens = {
    business_name: settings?.businessName ?? "your shop", business_phone: settings?.phone ?? "", business_email: settings?.email ?? "", business_address: address,
    business_hours: hours, logo_url: booking?.appearance?.logoUrl ?? bundle?.theme?.logoUrl ?? "", customer_name: d.customerName, customer_phone: d.phone,
    customer_email: d.email ?? "", vehicle: `${car}${d.vin ? ` · VIN ${d.vin}` : ""}`, date: d.preferredDate || "any day", time: d.slot ?? "",
    dropoff: d.dropOff === "wait" ? "will wait" : "drop off", message: `${d.issue || "-"}${answers ? `\nAdditional answers:\n${answers}` : ""}`,
  };
  const adminBody = replaceTokens(booking?.adminEmailTemplate ?? "New appointment request for {{business_name}}\n\nCustomer: {{customer_name}} · {{customer_phone}} · {{customer_email}}\nVehicle: {{vehicle}}\nWhen: {{date}} at {{time}} · {{dropoff}}\nIssue: {{message}}", tokens);
  const customerBody = replaceTokens(booking?.customerEmailTemplate ?? "Hi {{customer_name}},\n\nThanks for requesting service with {{business_name}}. We received your request for {{date}} at {{time}} and will contact you shortly to confirm.\n\n{{business_name}} · {{business_phone}}", tokens);
  await Promise.allSettled([
    sendEmail(booking?.notifyEmails ?? [], replaceTokens(booking?.adminEmailSubject ?? "New appointment: {{customer_name}}", tokens), adminBody),
    d.email ? sendEmail([d.email], replaceTokens(booking?.customerEmailSubject ?? "We received your request — {{business_name}}", tokens), customerBody) : Promise.resolve(),
    sendSms(booking?.notifySms ?? [], replaceTokens(booking?.smsTemplate ?? "{{business_name}}: New service request from {{customer_name}} for {{date}} at {{time}}. {{customer_phone}}", tokens).slice(0, 1000)),
  ]);

  return NextResponse.json({ ok: true, id });
}
