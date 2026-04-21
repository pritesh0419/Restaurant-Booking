import express from "express";
import { RequestHandler } from "express";
import { BookingController } from "../controllers/BookingController";

export function createBookingRoutes(requireAuth: RequestHandler, bookingController: BookingController) {
  const router = express.Router();

  router.post("/bookings/guest", bookingController.createGuest);
  router.post("/bookings", requireAuth, bookingController.createRegistered);
  router.get("/bookings/my", requireAuth, bookingController.listMine);
  router.patch("/bookings/:id/cancel", requireAuth, bookingController.cancelMine);

  return router;
}
