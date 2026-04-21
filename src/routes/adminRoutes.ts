import express from "express";
import { RequestHandler } from "express";
import { AdminController } from "../controllers/AdminController";

export function createAdminRoutes(requireAdmin: RequestHandler[], adminController: AdminController) {
  const router = express.Router();

  router.get("/admin/bookings", ...requireAdmin, adminController.listBookings);
  router.patch("/admin/bookings/:id/approve", ...requireAdmin, adminController.approveBooking);
  router.patch("/admin/bookings/:id/decline", ...requireAdmin, adminController.declineBooking);
  router.patch("/admin/bookings/:id", ...requireAdmin, adminController.updateBooking);
  router.get("/admin/analytics", ...requireAdmin, adminController.getAnalytics);

  return router;
}
