import { systemPage } from "../_page";
export const dynamic = "force-dynamic";
export const GET = () =>
  systemPage("We'll be right back", "This website is temporarily unavailable. Please check back soon or give us a call.", 503);
