// Draft previews: same layout as public sites, but always rendered fresh (never ISR-cached).
export const dynamic = "force-dynamic";
export { default, generateMetadata } from "../../s/[site]/layout";
