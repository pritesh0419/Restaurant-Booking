import { NextFunction, Request, Response } from "express";
import { AuthService } from "../services/AuthService";

export class AuthController {
  authService: AuthService;

  constructor(authService: AuthService) {
    this.authService = authService;
  }

  register = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await this.authService.register(request.body);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  };

  login = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const result = await this.authService.login(request.body);
      response.json(result);
    } catch (error) {
      next(error);
    }
  };
}
