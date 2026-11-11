import { z } from "zod";
import type { BookingField } from "./schema";

export const fieldSchema = z.object({
  key: z.string().regex(/^[a-z][a-z0-9_]{0,39}$/),
  label: z.string().trim().min(1).max(100),
  type: z.enum(["text", "email", "tel", "textarea", "select", "checkbox"]),
  required: z.boolean().optional(),
  placeholder: z.string().max(160).optional(),
  options: z.array(z.string().trim().min(1).max(100)).max(30).optional(),
});
export const fieldsSchema = z.array(fieldSchema).max(24).superRefine((fields, ctx) => {
  const seen = new Set<string>();
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (seen.has(f.key)) ctx.addIssue({ code: "custom", message: "Duplicate field key", path: [i, "key"] });
    if (f.type === "select" && !f.options?.length) ctx.addIssue({ code: "custom", message: "Select needs options", path: [i, "options"] });
    seen.add(f.key);
  }
});
export function validateExtraFields(definitions: BookingField[], input: unknown): Record<string, string | boolean> {
  const parsed = fieldsSchema.parse(definitions);
  const value = z.record(z.string(), z.union([z.string(), z.boolean()])).safeParse(input);
  if (!value.success) throw new Error("Invalid booking form fields");
  const cleaned: Record<string, string | boolean> = {};
  for (const field of parsed) {
    const raw = value.data[field.key];
    const v = field.type === "checkbox" ? raw === true : (typeof raw === "string" ? raw.trim() : "");
    if (field.required && (v === "" || v === false)) throw new Error(`${field.label} is required`);
    if (typeof v === "string") {
      if (v.length > (field.type === "textarea" ? 1500 : 255)) throw new Error(`${field.label} is too long`);
      if (field.type === "email" && v && !z.email().safeParse(v).success) throw new Error(`${field.label} must be a valid email`);
      if (field.type === "select" && v && !field.options?.includes(v)) throw new Error(`${field.label} has an invalid option`);
    }
    cleaned[field.key] = v;
  }
  return cleaned;
}
