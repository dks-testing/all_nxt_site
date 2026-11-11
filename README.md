# Shop Platform

Administrator documentation: [`docs/USER_MANUAL.md`](docs/USER_MANUAL.md)

One Next.js codebase and one MySQL database serve many small-business websites. A central admin lists every site and can **publish, unpublish, clone and customize** each one: logo, colours, fonts, banners, contact info, hours, pages, services, specials, FAQ, booking and domains.

The first tenant is **Mick's Repair** (migrated from the WordPress site at micksrepair.com), seeded with its pages, 16 services, specials, FAQ, case studies, menus and old-URL redirects.

```
apps/
  sites/    Public websites. Resolves the site from the Host header, renders shared section blocks in that site's theme.
  admin/    Central backend: sites dashboard, per-site editor, users and roles.
packages/
  db/       Drizzle schema (MySQL), site-scoped queries, clone service, block definitions, theme + preview helpers, seed.
```

## How it works

| Concern | Implementation |
| --- | --- |
| Which site to show | `apps/sites/proxy.ts` maps the hostname to a site (custom domain, or `<slug>.<PLATFORM_ROOT_DOMAIN>`), then rewrites to `/s/<siteId>/…`. Host lookups are cached in memory for 30 s. |
| Page content | `pages` + `page_sections`. Each section has a `type` (hero, services_grid, reviews, booking_form, …) and JSON `props` validated by Zod (`packages/db/src/blocks.ts`). The admin form for each block is generated from the same definition. |
| Theming | `themes` row becomes CSS variables (`--color-primary`, `--font-heading`, …) injected into the page. Every component uses the variables, so no rebuild is needed per site. |
| Caching | All reads are cached with `unstable_cache` under the tag `site:<id>`. Saving anything in the admin calls `POST /api/revalidate/` on the sites app, which expires only that site's tag. |
| Publish / unpublish | `sites.status`. Unpublished/draft sites return a 503 "be right back" page. Publishing snapshots the content into `site_versions` (restore from the Overview tab). |
| Draft preview | Admin signs an HMAC token; `?preview=<token>` sets a cookie and the proxy routes to `/p/…`, which is always rendered fresh and marked `noindex`. |
| Clone | `cloneSite()` copies settings, theme, pages + sections, services, specials, FAQ, case studies, menus, banners, booking settings, redirects and integrations in one transaction. It does **not** copy domains, appointments, members, testimonials (optional) or the Google rating, and it disables analytics IDs. |
| Old URLs | Service pages live at `/<slug>/` (same as WordPress), `trailingSlash: true`, and the `redirects` table handles `/?p=123` style links with 301s. |
| SEO | Per-page title/description/canonical, `AutoRepair`/`LocalBusiness` JSON-LD with hours and rating, `FAQPage` and `Service` schema, per-host `sitemap.xml` and `robots.txt`. |
| Booking | Native form → `POST /api/appointments/` (validated, honeypot + rate limit) → `appointments` table → email (Resend) and SMS (Twilio) if configured → admin inbox with status. |
| Auth | Email + password (bcrypt), signed JWT cookie. Roles: `SUPER_ADMIN` (all sites) or per-site `OWNER` / `EDITOR` / `VIEWER`. Every server action re-checks access for the site it touches. |

## Run locally

Requirements: Node 22+, pnpm 10, MySQL 8 (or `docker compose up -d`).

```bash
pnpm install
cp .env.example .env              # then edit secrets
ln -s ../../.env apps/sites/.env  # Next.js reads .env from each app folder
ln -s ../../.env apps/admin/.env
pnpm db:push                      # create tables
pnpm db:seed                      # Mick's Repair + super-admin from ADMIN_EMAIL / ADMIN_PASSWORD
pnpm --filter @platform/db test   # clone / isolation / publish integration test
pnpm dev                          # sites on :3000, admin on :3001
```

- Admin: http://localhost:3001 (log in with `ADMIN_EMAIL` / `ADMIN_PASSWORD`)
- Mick's Repair: http://micks-repair.localhost:3000 (browsers resolve `*.localhost` to your machine)
- Any clone: http://&lt;slug&gt;.localhost:3000

## Deploy (Vercel + managed MySQL)

1. **Database**: create a MySQL 8 database (PlanetScale, AWS RDS, Aiven, DigitalOcean). Set `DATABASE_URL`, run `pnpm db:push` and `pnpm db:seed` once from your machine or CI.
2. **Two Vercel projects** from this repo:
   - `sites`: Root Directory `apps/sites`. Add a wildcard domain `*.yourplatform.com` and set `PLATFORM_ROOT_DOMAIN=yourplatform.com`.
   - `admin`: Root Directory `apps/admin`, domain e.g. `admin.yourplatform.com`. Set `SITES_APP_URL=https://yourplatform-sites.vercel.app` (or any domain of the sites project).
   - Both: `DATABASE_URL`, `REVALIDATE_SECRET`, `PREVIEW_SECRET` (must match), plus `AUTH_SECRET` on admin and `RESEND_API_KEY` / `NOTIFY_FROM_EMAIL` / `TWILIO_*` on sites if you want notifications.
3. **Custom domains**: add the shop's domain in Admin → Domains, point DNS (A `76.76.21.21`, CNAME `www` → `cname.vercel-dns.com`), add the domain to the `sites` Vercel project, then click *Mark verified*. Automating step 3 with the Vercel Domains API is a small next step (see below).

### Cutover for micksrepair.com
Follow the checklist in the migration plan doc: crawl the old site, compare titles/meta on staging, confirm the redirects, lower DNS TTL, switch DNS, submit the sitemap in Search Console. Before launch, **replace the placeholder Terms and Privacy pages** and paste the exact copy you want from WordPress (seed copy is condensed), and re-host the logo/images (they currently load from the old `wp-content/uploads` URLs, which disappear when WordPress is switched off).

## What's in this MVP vs next

Done: monorepo, schema, host routing, theming, 13 section blocks, service pages, booking + inbox, sitemap/robots/schema, redirects, admin (dashboard, create/clone/publish/unpublish/archive/delete, version restore, branding with live preview + contrast check, business info + hours, page/section editor, services/specials/FAQ/testimonials/case studies/banners/redirects editors, navigation, domains, booking settings, integrations GA4/GTM/embeds, team + users, audit log), CI, integration test.

Deliberate choices to know about:
- **Saving on a published site goes live immediately** (the site's cache is refreshed). Use *Preview draft* for unpublished sites, and *Restore* on Overview to roll back to a published version.
- **Drizzle ORM** instead of Prisma: the plan allowed either; current Prisma majors require driver adapters for MySQL, which added risk for little gain.
- Images use a per-site Media Library with automatic sizing and WebP optimization. Local/persistent-server uploads work now; serverless production requires an S3/R2 storage adapter.
- Testimonials were **not** seeded: add real reviews in the admin (or build the Google Places sync below). The Google rating (4.6 / 84) is set manually in Business info.

Suggested next steps:
1. Add an S3/R2 adapter for the existing per-site Media Library before serverless production deployment.
2. Vercel Domains API: attach/verify domains and SSL automatically from the Domains tab.
3. Google Places sync for rating + reviews (`google_place_id` column exists).
4. Inject Meta Pixel and chat widget (config is already stored per site).
5. Draft/publish workflow for content edits on live sites (staging copies of rows), if editors need to batch changes before they go live.
6. Shared rate limiting (Upstash) and cross-instance host-cache invalidation for very large fleets.


## November 2026 continuation patch

See [`docs/CONTINUATION_UPDATE.md`](docs/CONTINUATION_UPDATE.md) for safe migration, Windows commands, media limitations and feature status. The seed is now non-destructive, `db:push` no longer uses `--force`, and there is an additive upgrade script. The dynamic booking-form fields, site theme controls, SEO redirects and local media library were added after the original MVP release. Site owners should test their live migrations on staging before upgrading production.
