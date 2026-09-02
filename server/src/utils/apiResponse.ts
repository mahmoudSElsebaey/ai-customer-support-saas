import type { Response } from "express";

export function successResponse<
  T = unknown
>(res: Response, data: T, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(
  res: Response,
  message: string,
  code = "ERROR",
  statusCode = 400
) {
  return res.status(statusCode).json({
    success: false,
    message,
    code,
  });
}
