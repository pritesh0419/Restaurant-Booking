import { NextFunction, Request, Response } from "express";
import { AppError } from "../../application/errors/AppError";
import { Logger } from "../../application/services/Logger";

export function errorHandler(logger: Logger) {
  return (error: Error, request: Request, response: Response, _next: NextFunction) => {
    if (error instanceof AppError) {
      logger.warn("Handled application error.", {
        path: request.path,
        code: error.code,
        message: error.message
      });

      response.status(error.statusCode).json({
        error: error.code,
        message: error.message
      });
      return;
    }

    logger.error("Unhandled server error.", {
      path: request.path,
      message: error.message
    });

    response.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
      message: "Something went wrong."
    });
  };
}
