import type { ApiErrorBody } from "@latelylebanon/shared";

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields: Record<string, string> = {},
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export async function toApiError(res: Response): Promise<ApiError> {
  try {
    const body = (await res.json()) as ApiErrorBody;
    return new ApiError(res.status, body.error.code, body.error.message, body.error.fields ?? {});
  } catch {
    return new ApiError(res.status, "unknown", "Something went wrong. Please try again.");
  }
}

export function errorMessage(err: unknown): string {
  if (err instanceof ApiError) return err.message;
  if (err instanceof TypeError) return "We couldn't reach the server. Check your connection and try again.";
  return "Something went wrong. Please try again.";
}
