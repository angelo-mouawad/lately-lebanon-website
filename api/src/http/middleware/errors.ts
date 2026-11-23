import { Prisma } from "@prisma/client";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { ZodError } from "zod";
import type { ApiErrorBody } from "@latelylebanon/shared";
import { AppError } from "../../lib/errors";
import { logger } from "../../lib/logger";
import { fieldErrors } from "../validate";

function send(res: Response, status: number, error: ApiErrorBody["error"]) {
  res.status(status).json({ error } satisfies ApiErrorBody);
}

export function notFoundHandler(_req: Request, res: Response) {
  send(res, 404, { code: "not_found", message: "Not found." });
}

export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return send(res, err.status, { code: err.code, message: err.message, fields: err.fields });
  }
  if (err instanceof ZodError) {
    return send(res, 400, { code: "bad_request", message: "Please check the highlighted fields.", fields: fieldErrors(err) });
  }
  if (err instanceof multer.MulterError) {
    const message = err.code === "LIMIT_FILE_SIZE" ? "That photo is too large. Please use one under 10 MB." : "That upload didn't work.";
    return send(res, 400, { code: "upload", message });
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return send(res, 409, { code: "conflict", message: "Something with the same name or code already exists." });
  }
  if (err instanceof SyntaxError && "body" in err) {
    return send(res, 400, { code: "bad_request", message: "The request was not valid." });
  }

  logger.error(`Unhandled error on ${req.method} ${req.path}`, err);
  send(res, 500, { code: "server_error", message: "Something went wrong on our side. Please try again." });
}
