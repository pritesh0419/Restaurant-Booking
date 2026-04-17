import { NextFunction, Response } from "express";
import { AppError } from "../../application/errors/AppError";
import { TokenService } from "../../application/services/TokenService";
import { AuthenticatedRequest } from "../http/types";

export function authMiddleware(tokenService: TokenService) {
  return (request: AuthenticatedRequest, _response: Response, next: NextFunction) => {
    const authorization = request.headers.authorization;
    if (!authorization?.startsWith("Bearer ")) {
      next(new AppError("Authentication token is required.", 401, "UNAUTHORIZED"));
      return;
    }

    try {
      const token = authorization.replace("Bearer ", "");
      const payload = tokenService.verify(token);
      request.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role
      };
      next();
    } catch {
      next(new AppError("Invalid or expired authentication token.", 401, "UNAUTHORIZED"));
    }
  };
}
