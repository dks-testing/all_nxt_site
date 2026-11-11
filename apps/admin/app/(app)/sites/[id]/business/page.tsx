import { getDb, siteSettings, eq } from "@platform/db";
import { loadSite } from "@/lib/site";
import { saveBusiness } from "@/lib/actions/content";
import { PageHeader, Card, Input, Textarea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/ConfirmButton";

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export default async function BusinessPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await loadSite(id, "EDITOR");
  const [s] = await getDb().select().from(siteSettings).where(eq(siteSettings.siteId, id));
  const a = s?.address;
  const hours = Object.fromEntries((s?.hours ?? []).map((h) => [h.day, h]));
  return (
    <>
      <PageHeader title="Business info" description="Contact details used in the header, footer, map, booking emails and Google schema." />
      <form action={saveBusiness} className="space-y-6">
        <input type="hidden" name="siteId" value={id} />
        <Card title="Basics">
          <div className="grid gap-4 sm:grid-cols-2">
            <input type="hidden" name="businessName" value={s?.businessName ?? "Untitled"} />
            <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 text-sm text-indigo-900 sm:col-span-2">Business name is managed from <a className="font-semibold underline" href={`/sites/${id}/global`}>Global settings</a> so it updates everywhere.</div>
            <Select label="Business type (schema.org)" name="businessType" defaultValue={s?.businessType ?? "AutoRepair"} options={["AutoRepair", "LocalBusiness", "TireShop", "AutoBodyShop", "AutoDealer", "HomeAndConstructionBusiness", "ProfessionalService"]} />
            <Input label="Tagline" name="tagline" defaultValue={s?.tagline ?? ""} className="sm:col-span-2" />
            <Input label="Phone" name="phone" defaultValue={s?.phone ?? ""} />
            <Input label="Email" name="email" type="email" defaultValue={s?.email ?? ""} />
            <Input label="Service area" name="serviceArea" defaultValue={s?.serviceArea ?? ""} className="sm:col-span-2" help='Shown as "Serving …" on the contact section.' />
            <Textarea label="Footer note" name="footerNote" defaultValue={s?.footerNote ?? ""} rows={2} className="sm:col-span-2" />
          </div>
        </Card>
        <Card title="Address">
          <div className="grid gap-4 sm:grid-cols-6">
            <Input label="Street" name="street" defaultValue={a?.street} className="sm:col-span-6" />
            <Input label="City" name="city" defaultValue={a?.city} className="sm:col-span-2" />
            <Input label="State / region" name="region" defaultValue={a?.region} className="sm:col-span-2" />
            <Input label="ZIP / postal code" name="postalCode" defaultValue={a?.postalCode} />
            <Input label="Country" name="country" defaultValue={a?.country ?? "US"} />
          </div>
        </Card>
        <Card title="Opening hours">
          <div className="space-y-2">
            {DAYS.map((d) => (
              <div key={d} className="grid grid-cols-[3rem_1fr_1fr_auto] items-center gap-3 text-sm">
                <span className="font-semibold">{d}</span>
                <input type="time" name={`open_${d}`} defaultValue={hours[d]?.open ?? "08:00"} className="input" aria-label={`${d} opens`} />
                <input type="time" name={`close_${d}`} defaultValue={hours[d]?.close ?? "17:00"} className="input" aria-label={`${d} closes`} />
                <label className="flex items-center gap-1.5"><input type="checkbox" name={`closed_${d}`} defaultChecked={hours[d]?.closed ?? false} /> Closed</label>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Reviews & social" description="The rating appears in the hero and reviews sections and in Google rich results.">
          <div className="grid gap-4 sm:grid-cols-3">
            <Input label="Google rating" name="ratingValue" defaultValue={s?.ratingValue ?? ""} placeholder="4.6" />
            <Input label="Number of reviews" name="ratingCount" type="number" defaultValue={s?.ratingCount ?? ""} />
            <Input label="Google Place ID" name="googlePlaceId" defaultValue={s?.googlePlaceId ?? ""} help="For automatic review sync later." />
            {(["google", "facebook", "instagram", "yelp", "youtube", "x"] as const).map((k) => (
              <Input key={k} label={k === "google" ? "Google reviews link" : k.charAt(0).toUpperCase() + k.slice(1)} name={`social_${k}`} defaultValue={s?.social?.[k] ?? ""} />
            ))}
          </div>
        </Card>
        <SubmitButton>Save business info</SubmitButton>
      </form>
    </>
  );
}
