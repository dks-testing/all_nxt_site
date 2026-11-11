import { systemPage } from "../_page";
export const dynamic = "force-dynamic";
export const GET = () => systemPage("Site not found", "There is no website configured for this address.", 404);
