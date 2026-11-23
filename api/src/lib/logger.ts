/**
 * Logs go to stdout and stderr only. Hostinger captures them, and nothing is written
 * to disk, so there is no log rotation to manage.
 */
type Level = "info" | "warn" | "error";

function write(level: Level, message: string, meta?: unknown) {
  const line = JSON.stringify({
    t: new Date().toISOString(),
    level,
    message,
    ...(meta instanceof Error
      ? { error: meta.message, stack: meta.stack }
      : meta !== undefined
        ? { meta }
        : {}),
  });
  if (level === "error") console.error(line);
  else if (level === "warn") console.warn(line);
  else console.log(line);
}

export const logger = {
  info: (message: string, meta?: unknown) => write("info", message, meta),
  warn: (message: string, meta?: unknown) => write("warn", message, meta),
  error: (message: string, meta?: unknown) => write("error", message, meta),
};
