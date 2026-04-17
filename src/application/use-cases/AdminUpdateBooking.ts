import { AppError } from "../errors/AppError";
import { Logger } from "../services/Logger";
import { BookingRepository, UpdateBookingInput } from "../../domain/repositories/BookingRepository";

export class AdminUpdateBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly logger: Logger
  ) {}

  async execute(bookingId: string, adminUserId: string, input: UpdateBookingInput) {
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
}
