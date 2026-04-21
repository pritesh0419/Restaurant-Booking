import express from "express";
import { AuthController } from "../controllers/AuthController";

export function createAuthRoutes(authController: AuthController) {
  const router = express.Router();

  router.post("/auth/register", authController.register);
  router.post("/auth/login", authController.login);

  return router;
}
