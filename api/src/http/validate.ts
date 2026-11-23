import { z, type ZodType } from "zod";
import { badRequest } from "../lib/errors";

/** Turns Zod issues into { "customer.phone": "Please enter a phone number" }. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

/** Validates input with a Zod schema and throws a friendly 400 error when it doesn't match. */
export function parse<S extends ZodType>(schema: S, data: unknown): z.output<S> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const fields = fieldErrors(result.error);
    const first = Object.values(fields)[0];
    throw badRequest(first ?? "Please check the highlighted fields.", fields);
  }
  return result.data;
}

const idSchema = z.coerce.number().int().positive();

export function parseId(value: unknown): number {
  const result = idSchema.safeParse(value);
  if (!result.success) throw badRequest("That link isn't valid.");
  return result.data;
}
