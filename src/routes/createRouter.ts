import express from "express";
import { AdminController } from "../controllers/AdminController";
import { AuthController } from "../controllers/AuthController";
import { BookingController } from "../controllers/BookingController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { AdminBookingService } from "../services/AdminBookingService";
import { AuthService } from "../services/AuthService";
import { BookingService } from "../services/BookingService";
import { TokenService } from "../services/TokenService";
import { createAdminRoutes } from "./adminRoutes";
import { createAuthRoutes } from "./authRoutes";
import { createBookingRoutes } from "./bookingRoutes";

interface RouteDependencies {
  authService: AuthService;
  bookingService: BookingService;
  adminBookingService: AdminBookingService;
  tokenService: TokenService;
}

export function createRouter(dependencies: RouteDependencies) {
  const router = express.Router();
  const requireAuth = authMiddleware(dependencies.tokenService);
  const requireAdmin = [requireAuth, requireRole("admin")];
  const authController = new AuthController(dependencies.authService);
  const bookingController = new BookingController(dependencies.bookingService);
  const adminController = new AdminController(dependencies.adminBookingService);

  router.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  router.use(createAuthRoutes(authController));
  router.use(createBookingRoutes(requireAuth, bookingController));
  router.use(createAdminRoutes(requireAdmin, adminController));

  return router;
}
