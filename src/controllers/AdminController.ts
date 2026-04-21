import { NextFunction, Request, Response } from "express";
import { AdminBookingService } from "../services/AdminBookingService";
import { AuthenticatedRequest } from "../utils/types";

type BookingStatus = "pending" | "approved" | "declined" | "cancelled";

export class AdminController {
  adminBookingService: AdminBookingService;

  constructor(adminBookingService: AdminBookingService) {
    this.adminBookingService = adminBookingService;
  }

  listBookings = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const status = typeof request.query.status === "string" ? request.query.status : undefined;
      const reservationDate =
        typeof request.query.date === "string" ? request.query.date : undefined;

      const bookings = await this.adminBookingService.listBookings({
        status: status as BookingStatus | undefined,
        reservationDate
      });
      response.json(bookings);
    } catch (error) {
      next(error);
    }
  };

  approveBooking = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const booking = await this.adminBookingService.updateBooking(this.routeId(request.params.id), request.user!.id, {
        status: "approved",
        reviewReason: request.body.reason
      });
      response.json(booking);
    } catch (error) {
      next(error);
    }
  };

  declineBooking = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const booking = await this.adminBookingService.updateBooking(this.routeId(request.params.id), request.user!.id, {
        status: "declined",
        reviewReason: request.body.reason
      });
      response.json(booking);
    } catch (error) {
      next(error);
    }
  };

  updateBooking = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      const booking = await this.adminBookingService.updateBooking(
        this.routeId(request.params.id),
        request.user!.id,
        request.body
      );
      response.json(booking);
    } catch (error) {
      next(error);
    }
  };

  getAnalytics = async (_request: Request, response: Response, next: NextFunction) => {
    try {
      const analytics = await this.adminBookingService.getAnalytics();
      response.json(analytics);
    } catch (error) {
      next(error);
    }
  };

  routeId(value: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
  }
}
