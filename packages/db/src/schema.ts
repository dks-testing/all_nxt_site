import {
  mysqlTable,
  varchar,
  text,
  int,
  boolean,
  json,
  datetime,
  mysqlEnum,
  decimal,
  uniqueIndex,
  index,
  date,
} from "drizzle-orm/mysql-core";
import { sql } from "drizzle-orm";

const id = () => varchar("id", { length: 36 }).primaryKey().$defaultFn(() => crypto.randomUUID());
const siteId = () => varchar("site_id", { length: 36 }).notNull();
const createdAt = () => datetime("created_at").notNull().default(sql`CURRENT_TIMESTAMP`);
const updatedAt = () =>
  datetime("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`).$onUpdate(() => new Date());

/* ---------- shared JSON types ---------- */

export type Address = { street: string; city: string; region: string; postalCode: string; country: string };
export type DayHours = { day: "Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun"; open?: string; close?: string; closed?: boolean };
export type SocialLinks = { facebook?: string; instagram?: string; google?: string; yelp?: string; x?: string; youtube?: string };
export type ThemeColors = {
  primary: string;
  primaryForeground: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
};
export type ThemeFonts = { heading: string; body: string };
export type MenuItem = { label: string; href: string; badge?: string; children?: MenuItem[] };
export type BookingField = {
  key: string;
  label: string;
  type: "text" | "email" | "tel" | "textarea" | "select" | "checkbox";
  required?: boolean;
  placeholder?: string;
  options?: string[];
};
export type BookingAppearance = {
  accentColor?: string;
  accentTextColor?: string;
  formBackground?: string;
  formTextColor?: string;
  inputBackground?: string;
  inputTextColor?: string;
  logoUrl?: string;
  landingHeading?: string;
  appointmentHeading?: string;
};
export type DesignOptions = {
  headerStyle?: "standard" | "angled";
  heroStyle?: "classic" | "micks-overlay";
  quoteSvgUrl?: string;
  quoteSvgColor?: string;
  quoteSvgHoverColor?: string;
  serviceStepIconUrl?: string;
  serviceStepIconColor?: string;
  serviceStepIconHoverColor?: string;
  /** Legacy multi-icon settings retained so existing websites keep their first uploaded icon. */
  serviceTrustIconUrls?: string[];
  serviceTrustIconColor?: string;
  serviceTrustIconHoverColor?: string;
  innerHeroImageUrl?: string;
  serviceDefaultImageUrl?: string;
  serviceBadgeOneUrl?: string;
  serviceBadgeTwoUrl?: string;
  serviceBadgeThreeUrl?: string;
  serviceBadgeOneLink?: string;
  serviceBadgeTwoLink?: string;
  serviceBadgeThreeLink?: string;
  serviceBadgeOneAlt?: string;
  serviceBadgeTwoAlt?: string;
  serviceBadgeThreeAlt?: string;
  serviceBadgeOneVisible?: boolean;
  serviceBadgeTwoVisible?: boolean;
  serviceBadgeThreeVisible?: boolean;
  serviceProcessImageUrl?: string;
  serviceTrustImageUrl?: string;
  serviceVehicleImageUrl?: string;
  footerBackgroundImageUrl?: string;
  aboutOwnerImageUrl?: string;
  aboutTeamImageUrl?: string;
  aboutVehicleImageUrl?: string;
  aboutCrewImageOneUrl?: string;
  aboutCrewImageTwoUrl?: string;
  aboutCrewImageThreeUrl?: string;
  diagnosticsImageUrl?: string;
  tiresImageUrl?: string;
  scheduleCtaHref?: string;
  diagnosticsCtaHref?: string;
  tiresCtaHref?: string;
  buttonBackground?: string;
  buttonText?: string;
  buttonHoverBackground?: string;
  buttonHoverText?: string;
  buttonSkew?: number;
  buttonHoverTranslateY?: number;
  badgeBackground?: string;
  badgeText?: string;
};
export type VehicleInfo = { plate?: string; state?: string; vin?: string; year?: string; make?: string; model?: string };

/* ---------- sites + domains ---------- */

export const siteStatus = ["DRAFT", "PUBLISHED", "UNPUBLISHED", "ARCHIVED"] as const;
export type SiteStatus = (typeof siteStatus)[number];

export const sites = mysqlTable(
  "sites",
  {
    id: id(),
    name: varchar("name", { length: 191 }).notNull(),
    slug: varchar("slug", { length: 191 }).notNull(),
    status: mysqlEnum("status", siteStatus).notNull().default("DRAFT"),
    isTemplate: boolean("is_template").notNull().default(false),
    clonedFromId: varchar("cloned_from_id", { length: 36 }),
    publishedAt: datetime("published_at"),
    createdBy: varchar("created_by", { length: 36 }),
    createdAt: createdAt(),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("sites_slug_uq").on(t.slug)],
);

export const domains = mysqlTable(
  "domains",
  {
    id: id(),
    siteId: siteId(),
    hostname: varchar("hostname", { length: 253 }).notNull(),
    isPrimary: boolean("is_primary").notNull().default(false),
    verified: boolean("verified").notNull().default(false),
    sslStatus: mysqlEnum("ssl_status", ["PENDING", "ACTIVE", "ERROR"]).notNull().default("PENDING"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("domains_hostname_uq").on(t.hostname), index("domains_site_idx").on(t.siteId)],
);

/* ---------- settings + theme ---------- */

export const siteSettings = mysqlTable("site_settings", {
  siteId: varchar("site_id", { length: 36 }).primaryKey(),
  businessName: varchar("business_name", { length: 191 }).notNull(),
  tagline: varchar("tagline", { length: 255 }),
  phone: varchar("phone", { length: 40 }),
  email: varchar("email", { length: 191 }),
  address: json("address").$type<Address>(),
  hours: json("hours").$type<DayHours[]>(),
  social: json("social").$type<SocialLinks>(),
  googlePlaceId: varchar("google_place_id", { length: 191 }),
  ratingValue: decimal("rating_value", { precision: 2, scale: 1 }),
  ratingCount: int("rating_count"),
  businessType: varchar("business_type", { length: 64 }).notNull().default("AutoRepair"),
  serviceArea: varchar("service_area", { length: 255 }),
  footerNote: text("footer_note"),
  updatedAt: updatedAt(),
});

export const themes = mysqlTable("themes", {
  siteId: varchar("site_id", { length: 36 }).primaryKey(),
  logoUrl: varchar("logo_url", { length: 1024 }),
  logoDarkUrl: varchar("logo_dark_url", { length: 1024 }),
  faviconUrl: varchar("favicon_url", { length: 1024 }),
  colors: json("colors").$type<ThemeColors>().notNull(),
  fonts: json("fonts").$type<ThemeFonts>().notNull(),
  radius: varchar("radius", { length: 16 }).notNull().default("0.75rem"),
  buttonStyle: mysqlEnum("button_style", ["rounded", "pill", "square"]).notNull().default("rounded"),
  customCss: text("custom_css"),
  design: json("design").$type<DesignOptions>(),
  updatedAt: updatedAt(),
});

export const locations = mysqlTable(
  "locations",
  {
    id: id(),
    siteId: siteId(),
    name: varchar("name", { length: 191 }).notNull(),
    address: json("address").$type<Address>().notNull(),
    phone: varchar("phone", { length: 40 }),
    hours: json("hours").$type<DayHours[]>(),
    lat: decimal("lat", { precision: 10, scale: 7 }),
    lng: decimal("lng", { precision: 10, scale: 7 }),
    isPrimary: boolean("is_primary").notNull().default(false),
  },
  (t) => [index("locations_site_idx").on(t.siteId)],
);

/* ---------- pages + sections ---------- */

export const pages = mysqlTable(
  "pages",
  {
    id: id(),
    siteId: siteId(),
    slug: varchar("slug", { length: 191 }).notNull(), // "" = home
    title: varchar("title", { length: 191 }).notNull(),
    status: mysqlEnum("status", ["DRAFT", "PUBLISHED"]).notNull().default("PUBLISHED"),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", { length: 512 }),
    seoKeywords: text("seo_keywords"),
    ogImage: varchar("og_image", { length: 1024 }),
    canonicalUrl: varchar("canonical_url", { length: 1024 }),
    noIndex: boolean("no_index").notNull().default(false),
    noFollow: boolean("no_follow").notNull().default(false),
    sortOrder: int("sort_order").notNull().default(0),
    showInNav: boolean("show_in_nav").notNull().default(true),
    parentId: varchar("parent_id", { length: 36 }),
    updatedAt: updatedAt(),
  },
  (t) => [uniqueIndex("pages_site_slug_uq").on(t.siteId, t.slug)],
);

export const pageSections = mysqlTable(
  "page_sections",
  {
    id: id(),
    pageId: varchar("page_id", { length: 36 }).notNull(),
    siteId: siteId(),
    type: varchar("type", { length: 64 }).notNull(),
    props: json("props").$type<Record<string, unknown>>().notNull(),
    sortOrder: int("sort_order").notNull().default(0),
    isVisible: boolean("is_visible").notNull().default(true),
  },
  (t) => [index("sections_page_idx").on(t.pageId), index("sections_site_idx").on(t.siteId)],
);

/* ---------- content collections ---------- */

export const banners = mysqlTable(
  "banners",
  {
    id: id(),
    siteId: siteId(),
    imageUrl: varchar("image_url", { length: 1024 }),
    heading: varchar("heading", { length: 255 }).notNull(),
    subheading: text("subheading"),
    ctaLabel: varchar("cta_label", { length: 64 }),
    ctaUrl: varchar("cta_url", { length: 1024 }),
    placement: mysqlEnum("placement", ["hero", "top_bar", "promo"]).notNull().default("hero"),
    startsAt: datetime("starts_at"),
    endsAt: datetime("ends_at"),
    isActive: boolean("is_active").notNull().default(true),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("banners_site_idx").on(t.siteId)],
);

export const services = mysqlTable(
  "services",
  {
    id: id(),
    siteId: siteId(),
    slug: varchar("slug", { length: 191 }).notNull(),
    name: varchar("name", { length: 191 }).notNull(),
    summary: varchar("summary", { length: 512 }),
    body: text("body"),
    bullets: json("bullets").$type<string[]>(),
    icon: varchar("icon", { length: 64 }),
    imageUrl: varchar("image_url", { length: 1024 }),
    priceFrom: varchar("price_from", { length: 64 }),
    seoTitle: varchar("seo_title", { length: 255 }),
    seoDescription: varchar("seo_description", { length: 512 }),
    seoKeywords: text("seo_keywords"),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [uniqueIndex("services_site_slug_uq").on(t.siteId, t.slug)],
);

export const specials = mysqlTable(
  "specials",
  {
    id: id(),
    siteId: siteId(),
    title: varchar("title", { length: 191 }).notNull(),
    description: text("description"),
    discount: varchar("discount", { length: 64 }),
    couponCode: varchar("coupon_code", { length: 64 }),
    validUntil: date("valid_until", { mode: "string" }),
    imageUrl: varchar("image_url", { length: 1024 }),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("specials_site_idx").on(t.siteId)],
);

export const testimonials = mysqlTable(
  "testimonials",
  {
    id: id(),
    siteId: siteId(),
    author: varchar("author", { length: 191 }).notNull(),
    rating: int("rating").notNull().default(5),
    body: text("body").notNull(),
    source: mysqlEnum("source", ["manual", "google"]).notNull().default("manual"),
    reviewDate: date("review_date", { mode: "string" }),
    sortOrder: int("sort_order").notNull().default(0),
    isActive: boolean("is_active").notNull().default(true),
  },
  (t) => [index("testimonials_site_idx").on(t.siteId)],
);

export const faqs = mysqlTable(
  "faqs",
  {
    id: id(),
    siteId: siteId(),
    question: varchar("question", { length: 512 }).notNull(),
    answer: text("answer").notNull(),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("faqs_site_idx").on(t.siteId)],
);

export const caseStudies = mysqlTable(
  "case_studies",
  {
    id: id(),
    siteId: siteId(),
    title: varchar("title", { length: 191 }).notNull(),
    problem: text("problem").notNull(),
    diagnosis: text("diagnosis"),
    fix: text("fix"),
    imageUrl: varchar("image_url", { length: 1024 }),
    sortOrder: int("sort_order").notNull().default(0),
  },
  (t) => [index("case_studies_site_idx").on(t.siteId)],
);

export const menus = mysqlTable(
  "menus",
  {
    id: id(),
    siteId: siteId(),
    location: mysqlEnum("location", ["header", "footer"]).notNull(),
    items: json("items").$type<MenuItem[]>().notNull(),
  },
  (t) => [uniqueIndex("menus_site_location_uq").on(t.siteId, t.location)],
);

export const integrationTypes = ["ga4", "gtm", "meta_pixel", "tire_finder", "ai_diagnostic", "chat", "custom_head"] as const;
export const integrations = mysqlTable(
  "integrations",
  {
    id: id(),
    siteId: siteId(),
    type: mysqlEnum("type", integrationTypes).notNull(),
    config: json("config").$type<Record<string, string>>().notNull(),
    enabled: boolean("enabled").notNull().default(true),
  },
  (t) => [uniqueIndex("integrations_site_type_uq").on(t.siteId, t.type)],
);

/* ---------- booking ---------- */

export const bookingSettings = mysqlTable("booking_settings", {
  siteId: varchar("site_id", { length: 36 }).primaryKey(),
  enabled: boolean("enabled").notNull().default(true),
  slotMinutes: int("slot_minutes").notNull().default(30),
  openTime: varchar("open_time", { length: 5 }).notNull().default("07:30"),
  closeTime: varchar("close_time", { length: 5 }).notNull().default("16:30"),
  closedDays: json("closed_days").$type<number[]>().notNull(), // 0 = Sunday
  leadDays: int("lead_days").notNull().default(0),
  notifyEmails: json("notify_emails").$type<string[]>().notNull(),
  notifySms: json("notify_sms").$type<string[]>().notNull(),
  confirmationMessage: text("confirmation_message"),
  formFields: json("form_fields").$type<BookingField[]>(),
  disabledDates: json("disabled_dates").$type<string[]>(),
  appearance: json("appearance").$type<BookingAppearance>(),
  adminEmailSubject: varchar("admin_email_subject", { length: 255 }),
  adminEmailTemplate: text("admin_email_template"),
  customerEmailSubject: varchar("customer_email_subject", { length: 255 }),
  customerEmailTemplate: text("customer_email_template"),
  smsTemplate: text("sms_template"),
});

export const appointmentStatus = ["NEW", "CONFIRMED", "COMPLETED", "CANCELLED"] as const;
export const appointments = mysqlTable(
  "appointments",
  {
    id: id(),
    siteId: siteId(),
    customerName: varchar("customer_name", { length: 191 }).notNull(),
    phone: varchar("phone", { length: 40 }).notNull(),
    email: varchar("email", { length: 191 }),
    contactPref: mysqlEnum("contact_pref", ["phone", "text", "email"]).notNull().default("phone"),
    vehicle: json("vehicle").$type<VehicleInfo>().notNull(),
    preferredDate: date("preferred_date", { mode: "string" }),
    slot: varchar("slot", { length: 32 }),
    dropOff: mysqlEnum("drop_off", ["drop_off", "wait"]).notNull().default("drop_off"),
    issue: varchar("issue", { length: 500 }),
    extraFields: json("extra_fields").$type<Record<string, string | boolean>>(),
    status: mysqlEnum("status", appointmentStatus).notNull().default("NEW"),
    createdAt: createdAt(),
  },
  (t) => [index("appointments_site_idx").on(t.siteId, t.createdAt)],
);

export const formSubmissions = mysqlTable(
  "form_submissions",
  {
    id: id(),
    siteId: siteId(),
    formType: varchar("form_type", { length: 64 }).notNull(),
    payload: json("payload").$type<Record<string, unknown>>().notNull(),
    createdAt: createdAt(),
  },
  (t) => [index("form_submissions_site_idx").on(t.siteId)],
);

/* ---------- media, redirects ---------- */

export const media = mysqlTable(
  "media",
  {
    id: id(),
    siteId: siteId(),
    url: varchar("url", { length: 1024 }).notNull(),
    alt: varchar("alt", { length: 255 }),
    width: int("width"),
    height: int("height"),
    size: int("size"),
    folder: varchar("folder", { length: 191 }),
    createdAt: createdAt(),
  },
  (t) => [index("media_site_idx").on(t.siteId)],
);

export const redirects = mysqlTable(
  "redirects",
  {
    id: id(),
    siteId: siteId(),
    fromPath: varchar("from_path", { length: 512 }).notNull(),
    toPath: varchar("to_path", { length: 1024 }).notNull(),
    code: int("code").notNull().default(301),
  },
  (t) => [index("redirects_site_idx").on(t.siteId)],
);

/* ---------- users, roles, audit ---------- */

export const users = mysqlTable(
  "users",
  {
    id: id(),
    email: varchar("email", { length: 191 }).notNull(),
    name: varchar("name", { length: 191 }),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    globalRole: mysqlEnum("global_role", ["SUPER_ADMIN", "USER"]).notNull().default("USER"),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("users_email_uq").on(t.email)],
);

export const siteRoles = ["OWNER", "EDITOR", "VIEWER"] as const;
export type SiteRole = (typeof siteRoles)[number];
export const siteMembers = mysqlTable(
  "site_members",
  {
    id: id(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    siteId: siteId(),
    role: mysqlEnum("role", siteRoles).notNull().default("EDITOR"),
  },
  (t) => [uniqueIndex("site_members_uq").on(t.userId, t.siteId)],
);

export const auditLog = mysqlTable(
  "audit_log",
  {
    id: id(),
    userId: varchar("user_id", { length: 36 }),
    siteId: varchar("site_id", { length: 36 }),
    action: varchar("action", { length: 64 }).notNull(),
    detail: json("detail").$type<Record<string, unknown>>(),
    createdAt: createdAt(),
  },
  (t) => [index("audit_site_idx").on(t.siteId, t.createdAt)],
);

export const siteVersions = mysqlTable(
  "site_versions",
  {
    id: id(),
    siteId: siteId(),
    snapshot: json("snapshot").$type<Record<string, unknown>>().notNull(),
    note: varchar("note", { length: 255 }),
    createdBy: varchar("created_by", { length: 36 }),
    createdAt: createdAt(),
  },
  (t) => [index("site_versions_site_idx").on(t.siteId, t.createdAt)],
);
