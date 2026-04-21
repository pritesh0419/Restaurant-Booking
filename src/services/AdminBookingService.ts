import {
  BookingFilters,
  BookingRepository,
  UpdateBookingInput
} from "../repositories/BookingRepository";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../utils/AppError";
import { Logger } from "./Logger";

export class AdminBookingService {
  bookings: BookingRepository;
  users: UserRepository;
  logger: Logger;

  constructor(bookings: BookingRepository, users: UserRepository, logger: Logger) {
    this.bookings = bookings;
    this.users = users;
    this.logger = logger;
  }

  async listBookings(filters?: BookingFilters) {
    return this.bookings.findAll(filters);
  }

  async updateBooking(bookingId: string, adminUserId: string, input: UpdateBookingInput) {
    const existingBooking = await this.bookings.findById(bookingId);
    if (!existingBooking) {
      throw new AppError("Booking not found.", 404, "BOOKING_NOT_FOUND");
    }

    const updated = await this.bookings.update(bookingId, {
      ...input,
      reviewedBy: adminUserId
    });

    if (!updated) {
      throw new AppError("Booking could not be updated.", 500, "BOOKING_UPDATE_FAILED");
    }

    this.logger.info("Booking updated by admin.", { bookingId, adminUserId, status: updated.status });
    return updated;
  }

  async getAnalytics() {
    const [bookingAnalytics, userCount] = await Promise.all([
      this.bookings.getAnalytics(),
      this.users.count()
    ]);

    return {
      ...bookingAnalytics,
      totalUsers: userCount
    };
  }
}
