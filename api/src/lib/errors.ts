/** An error with a message that is safe to show to the person using the site. */
export class AppError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "AppError";
  }
}

export const notFound = (what = "That page") => new AppError(404, "not_found", `${what} could not be found.`);

export const badRequest = (message: string, fields?: Record<string, string>) =>
  new AppError(400, "bad_request", message, fields);

export const conflict = (message: string, fields?: Record<string, string>) =>
  new AppError(409, "conflict", message, fields);

export const unauthorized = () => new AppError(401, "unauthorized", "Please log in again.");

export const forbidden = () => new AppError(403, "forbidden", "Only the account owner can do this.");
