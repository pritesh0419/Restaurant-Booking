import { NextFunction, Request, Response } from "express";
import { BookingService } from "../services/BookingService";
import { AppError } from "../utils/AppError";
import { AuthenticatedRequest } from "../utils/types";

export class BookingController {
  bookingService: BookingService;

  constructor(bookingService: BookingService) {
    this.bookingService = bookingService;
  }

  createGuest = async (request: Request, response: Response, next: NextFunction) => {
    try {
      const booking = await this.bookingService.create(request.body);
      response.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  };

  createRegistered = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      if (!request.user) {
        throw new AppError("Authentication token is required.", 401, "UNAUTHORIZED");
      }

      const booking = await this.bookingService.create({
        ...request.body,
        customerEmail: request.user.email,
        userId: request.user.id
      });
      response.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  };

  listMine = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      if (!request.user) {
        throw new AppError("Authentication token is required.", 401, "UNAUTHORIZED");
      }

      const bookings = await this.bookingService.listMine(request.user.id);
      response.json(bookings);
    } catch (error) {
      next(error);
    }
  };

  cancelMine = async (request: AuthenticatedRequest, response: Response, next: NextFunction) => {
    try {
      if (!request.user) {
        throw new AppError("Authentication token is required.", 401, "UNAUTHORIZED");
      }

      const booking = await this.bookingService.cancel(this.routeId(request.params.id), request.user.id);
      response.json(booking);
    } catch (error) {
      next(error);
    }
  };

  routeId(value: string | string[]) {
    return Array.isArray(value) ? value[0] : value;
  }
}
