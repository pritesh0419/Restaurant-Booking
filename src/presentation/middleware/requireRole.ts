import { NextFunction, Response } from "express";
import { AppError } from "../../application/errors/AppError";
import { AuthenticatedRequest } from "../http/types";

export function requireRole(role: string) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    if (!request.user) {
      next(new AppError("Authentication token is required.", 401, "UNAUTHORIZED"));
      return;
    }

    if (request.user.role !== role) {
      next(new AppError("You do not have access to this resource.", 403, "FORBIDDEN"));
      return;
    }

    next();
  };
}
