import { revalidatePath } from "next/cache";
import { audit } from "@platform/db";
import { revalidateSite } from "./revalidate";

/** Call after every successful write: audit trail + refresh the public site + refresh admin views. */
export async function afterChange(siteId: string, userId: string, action: string, detail?: Record<string, unknown>) {
  await audit(userId, siteId, action, detail);
  await revalidateSite(siteId);
  revalidatePath(`/sites/${siteId}`, "layout");
}
