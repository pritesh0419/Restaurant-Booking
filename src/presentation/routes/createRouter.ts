import express from "express";
import { LoginUser } from "../../application/use-cases/LoginUser";
import { RegisterUser } from "../../application/use-cases/RegisterUser";
import { CreateBooking } from "../../application/use-cases/CreateBooking";
import { ListBookings } from "../../application/use-cases/ListBookings";
import { CancelBooking } from "../../application/use-cases/CancelBooking";
import { AdminListBookings } from "../../application/use-cases/AdminListBookings";
import { AdminUpdateBooking } from "../../application/use-cases/AdminUpdateBooking";
import { GetBookingAnalytics } from "../../application/use-cases/GetBookingAnalytics";
import { TokenService } from "../../application/services/TokenService";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireRole } from "../middleware/requireRole";
import { AuthenticatedRequest } from "../http/types";
import { AppError } from "../../application/errors/AppError";

interface RouteDependencies {
  registerUser: RegisterUser;
  loginUser: LoginUser;
  createBooking: CreateBooking;
  listBookings: ListBookings;
  cancelBooking: CancelBooking;
  adminListBookings: AdminListBookings;
  adminUpdateBooking: AdminUpdateBooking;
  getBookingAnalytics: GetBookingAnalytics;
  tokenService: TokenService;
}

export function createRouter(dependencies: RouteDependencies) {
  const router = express.Router();
  const requireAuth = authMiddleware(dependencies.tokenService);
  const requireAdmin = [requireAuth, requireRole("admin")] as const;
  const routeId = (value: string | string[]) => (Array.isArray(value) ? value[0] : value);

  router.get("/health", (_request, response) => {
    response.json({ status: "ok" });
  });

  router.post("/auth/register", async (request, response, next) => {
    try {
      const result = await dependencies.registerUser.execute(request.body);
      response.status(201).json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/auth/login", async (request, response, next) => {
    try {
      const result = await dependencies.loginUser.execute(request.body);
      response.json(result);
    } catch (error) {
      next(error);
    }
  });

  router.post("/bookings/guest", async (request, response, next) => {
    try {
      const booking = await dependencies.createBooking.execute(request.body);
      response.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  });

  router.post("/bookings", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      if (!request.user) {
        throw new AppError("Authentication token is required.", 401, "UNAUTHORIZED");
      }

      const booking = await dependencies.createBooking.execute({
        ...request.body,
        customerEmail: request.user.email,
        userId: request.user.id
      });
      response.status(201).json(booking);
    } catch (error) {
      next(error);
    }
  });

  router.get("/bookings/my", requireAuth, async (request: AuthenticatedRequest, response, next) => {
    try {
      if (!request.user) {
        throw new AppError("Authentication token is required.", 401, "UNAUTHORIZED");
      }

      const bookings = await dependencies.listBookings.execute(request.user.id);
      response.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    "/bookings/:id/cancel",
    requireAuth,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        if (!request.user) {
          throw new AppError("Authentication token is required.", 401, "UNAUTHORIZED");
        }

        const booking = await dependencies.cancelBooking.execute(routeId(request.params.id), request.user.id);
        response.json(booking);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get("/admin/bookings", ...requireAdmin, async (request, response, next) => {
    try {
      const status = typeof request.query.status === "string" ? request.query.status : undefined;
      const reservationDate =
        typeof request.query.date === "string" ? request.query.date : undefined;

      const bookings = await dependencies.adminListBookings.execute({
        status: status as "pending" | "approved" | "declined" | "cancelled" | undefined,
        reservationDate
      });
      response.json(bookings);
    } catch (error) {
      next(error);
    }
  });

  router.patch(
    "/admin/bookings/:id/approve",
    ...requireAdmin,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const booking = await dependencies.adminUpdateBooking.execute(routeId(request.params.id), request.user!.id, {
          status: "approved",
          reviewReason: request.body.reason
        });
        response.json(booking);
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    "/admin/bookings/:id/decline",
    ...requireAdmin,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const booking = await dependencies.adminUpdateBooking.execute(routeId(request.params.id), request.user!.id, {
          status: "declined",
          reviewReason: request.body.reason
        });
        response.json(booking);
      } catch (error) {
        next(error);
      }
    }
  );

  router.patch(
    "/admin/bookings/:id",
    ...requireAdmin,
    async (request: AuthenticatedRequest, response, next) => {
      try {
        const booking = await dependencies.adminUpdateBooking.execute(
          routeId(request.params.id),
          request.user!.id,
          request.body
        );
        response.json(booking);
      } catch (error) {
        next(error);
      }
    }
  );

  router.get("/admin/analytics", ...requireAdmin, async (_request, response, next) => {
    try {
      const analytics = await dependencies.getBookingAnalytics.execute();
      response.json(analytics);
    } catch (error) {
      next(error);
    }
  });

  return router;
}
