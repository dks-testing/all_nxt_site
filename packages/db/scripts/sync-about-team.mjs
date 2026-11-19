/** Idempotently sync the Mick's About Us page and seed reusable team profiles. */
import mysql from "mysql2/promise";

const WP = "https://www.micksrepair.com/wp-content/uploads";
const profiles = [
  ["Kelly Eggers", "", "A second-generation member of the family business, carrying forward Mick’s commitment to honest, dependable service.", `${WP}/2026/04/micks-repair-worthington-mn-kelly-eggers.jpeg`],
  ["Terry Eggers", "", "Part of the next generation leading the shop with straightforward advice and a focus on doing every job right.", `${WP}/2026/04/micks-repair-worthington-mn-terry-eggers.jpeg`],
  ["Cory Probst", "", "A trusted member of the crew focused on careful workmanship and reliable automotive service.", `${WP}/2026/04/micks-repair-worthington-mn-cory-probst.jpeg`],
  ["Service Team", "", "Helping customers with clear communication from check-in through pickup.", `${WP}/2026/06/team-3.png`],
  ["Repair Team", "", "Skilled technicians committed to quality repairs and ongoing training.", `${WP}/2026/06/team-1.png`],
  ["Shop Team", "", "Hands-on care supported by modern tools, experience, and attention to detail.", `${WP}/2026/06/team-2.png`],
];

function connectionUrl() {
  if (process.env.DATABASE_URL?.trim()) return process.env.DATABASE_URL.trim();
  if (!process.env.DB_NAME) throw new Error("Provide DB_NAME or DATABASE_URL");
  return `mysql://${encodeURIComponent(process.env.DB_USER || "root")}:${encodeURIComponent(process.env.DB_PASSWORD || "")}@${process.env.DB_HOST || "localhost"}:${process.env.DB_PORT || "3306"}/${encodeURIComponent(process.env.DB_NAME)}`;
}

const conn = await mysql.createConnection({ uri: connectionUrl(), ...(/^(true|1|yes)$/i.test(process.env.DB_SSL || "false") ? { ssl: {} } : {}) });
try {
  const [sites] = await conn.execute("SELECT id FROM sites WHERE slug=? LIMIT 1", ["micks-repair"]);
  if (!sites.length) throw new Error("micks-repair site not found");
  const siteId = sites[0].id;
  const [sections] = await conn.execute("SELECT ps.id, ps.props FROM page_sections ps INNER JOIN pages p ON p.id=ps.page_id WHERE ps.site_id=? AND p.slug='about-us' AND ps.type='about' LIMIT 1", [siteId]);
  if (!sections.length) throw new Error("About Us section not found");

  const teamMemberIds = [];
  for (let index = 0; index < profiles.length; index++) {
    const [name, position, description, imageUrl] = profiles[index];
    const [existing] = await conn.execute("SELECT id FROM team_profiles WHERE site_id=? AND name=? LIMIT 1", [siteId, name]);
    const id = existing[0]?.id || crypto.randomUUID();
    if (existing.length) {
      await conn.execute("UPDATE team_profiles SET position=?, description=?, image_url=COALESCE(image_url, ?), sort_order=?, is_active=TRUE WHERE id=?", [position || null, description, imageUrl, index, id]);
    } else {
      await conn.execute("INSERT INTO team_profiles (id, site_id, name, position, description, image_url, sort_order, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)", [id, siteId, name, position || null, description, imageUrl, index]);
    }
    teamMemberIds.push(id);
  }

  const current = typeof sections[0].props === "string" ? JSON.parse(sections[0].props) : sections[0].props;
  const props = {
    ...current,
    eyebrow: "About Us",
    heading: "Straight answers. Expert guidance.\nRepairs you can trust.",
    body: "At {{businessName}}, we’ve built our reputation by doing things the right way. For over 35 years, local families in Worthington have trusted us to diagnose issues accurately, explain what’s going on in plain language, and make sure every repair is done right the first time.\n\nConveniently located in historic downtown Worthington, right across from the courthouse, {{ownerName}} has been part of the community for decades. During Turkey Days, people fill our sidewalk, parking lot, and even the front doorway to watch the parade go by.\n\nToday, {{ownerName}} is run by Mick Eggers and his two sons, Kelly and Terry, carrying forward the same commitment to honest work and doing things the right way. No pressure. No unnecessary repairs. Just straightforward recommendations you can trust.\n\nWe know your time matters. That’s why we offer free pickup and delivery, making it easier to get your vehicle serviced without disrupting your day.\n\nEvery decision we make is based on what we would do if it were our own vehicle. That means focusing on what truly needs to be done and helping you move forward with confidence.",
    imageUrl: `${WP}/2026/04/micks-repair-worthington-mn-mick-eggers.jpeg`,
    highlights: [],
    variant: "default",
    missionHeading: "One Shop, One Mission",
    missionBody: "Keep our neighbors rolling with honest,\nhigh-quality auto care.",
    locationLabel: "Location",
    phoneLabel: "Phone",
    hoursLabel: "Hours",
    callCtaLabel: "Call Now",
    teamImageUrl: `${WP}/2026/04/micks-repair-worthington-mn-team.jpeg`,
    vehicleImageUrl: `${WP}/2026/04/blue-car.webp`,
    workHeading: "How We Work",
    workItems: [
      { title: "Straight-Talk Quotes", body: "No surprise add-ons; you approve every line before we touch a bolt." },
      { title: "Tools & Talent", body: "ASE-certified techs + factory-level diagnostics." },
      { title: "Speed With Integrity", body: "Same-day turnaround on most jobs; never at the cost of quality." },
      { title: "Neighbors First", body: "We live where we work, and our name rides on every repair." },
    ],
    ownerHeading: "Meet the Crew",
    ownerBody: "Mick Eggers\nFounder of {{businessName}}, Mick Eggers has spent his entire life building a reputation in the Worthington automotive community. For over 35 years, he has led a shop grounded in honesty, transparency, and long-term customer relationships. Today, he’s joined by his two sons, Kelly and Terry, continuing a tradition that has become a trusted name for generations of local families.\n\nSpend a few minutes in the lobby and you’ll see what sets this place apart. It’s not uncommon to hear a technician, or Mick himself, advising a customer not to move forward with a repair when the cost doesn’t make sense for the vehicle. How often do you find a shop willing to talk you out of spending money simply because it’s the right thing to do?\n\nMick Eggers represents a rare combination of technical expertise, relentless work ethic, and unwavering integrity. It’s what defines {{businessName}} and why it continues to earn the trust of the community year after year.",
    teamMemberIds,
    finalHeading: "Know Before You Go.",
    finalBody: "Describe what you’re seeing and get a clear answer in seconds.",
    finalCta: { label: "Start Diagnosis", href: "/diagnostics/" },
  };
  await conn.execute("UPDATE page_sections SET props=? WHERE id=?", [JSON.stringify(props), sections[0].id]);
  console.log(`Synced About Us and ${teamMemberIds.length} team profiles for ${siteId}`);
} finally {
  await conn.end();
}
