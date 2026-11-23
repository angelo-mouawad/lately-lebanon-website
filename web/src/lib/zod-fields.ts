import type { ZodError } from "zod";

/** Turns Zod issues into a map of field path to the first message, matching the API's format. */
export function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}
