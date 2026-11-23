"use client";

import { useState } from "react";
import { ApiError, errorMessage } from "@/lib/api-error";

/**
 * Runs a save and keeps track of busy state, the top error message and per field errors
 * returned by the API, so forms can show messages next to the right input.
 */
export function useSave() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fields, setFields] = useState<Record<string, string>>({});

  async function run<T>(action: () => Promise<T>): Promise<T | undefined> {
    setBusy(true);
    setError(null);
    setFields({});
    try {
      return await action();
    } catch (err) {
      setError(errorMessage(err));
      if (err instanceof ApiError) setFields(err.fields);
      return undefined;
    } finally {
      setBusy(false);
    }
  }

  return { busy, error, fields, run, setError, setFields };
}
