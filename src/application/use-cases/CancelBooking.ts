import { AppError } from "../errors/AppError";
import { Logger } from "../services/Logger";
import { BookingRepository } from "../../domain/repositories/BookingRepository";

export class CancelBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly logger: Logger
  ) {}

  async execute(bookingId: string, userId: string) {
    const booking = await this.bookings.findById(bookingId);
    if (!booking) {
      throw new AppError("Booking not found.", 404, "BOOKING_NOT_FOUND");
    }

    if (booking.userId !== userId) {
      throw new AppError("You can only cancel your own bookings.", 403, "FORBIDDEN");
    }

    if (booking.status === "cancelled") {
      throw new AppError("Booking is already cancelled.", 409, "BOOKING_CANCELLED");
    }

    const updated = await this.bookings.update(bookingId, { status: "cancelled" });
    if (!updated) {
      throw new AppError("Booking could not be cancelled.", 500, "BOOKING_UPDATE_FAILED");
    }

    this.logger.info("Booking cancelled.", { bookingId, userId });
    return updated;
  }
}
