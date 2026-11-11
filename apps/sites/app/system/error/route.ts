import { systemPage } from "../_page";
export const dynamic = "force-dynamic";
export const GET = () => systemPage("Something went wrong", "Please try again in a moment.", 500);
