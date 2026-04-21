import { BookingRepository } from "../repositories/BookingRepository";
import { AppError } from "../utils/AppError";
import { Logger } from "./Logger";

interface CreateBookingInput {
  customerName: string;
  customerEmail: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  notes?: string;
  userId?: string;
}

const MAX_SLOT_CAPACITY = 10;

export class BookingService {
  bookings: BookingRepository;
  logger: Logger;

  constructor(bookings: BookingRepository, logger: Logger) {
    this.bookings = bookings;
    this.logger = logger;
  }

  async create(input: CreateBookingInput) {
    if (!input.customerName || !input.customerEmail || !input.reservationDate || !input.reservationTime) {
      throw new AppError("Booking name, email, date, and time are required.", 400, "VALIDATION_ERROR");
    }

    if (!Number.isInteger(input.partySize) || input.partySize < 1 || input.partySize > 12) {
      throw new AppError("Party size must be between 1 and 12.", 400, "VALIDATION_ERROR");
    }

    const reservationDate = input.reservationDate.trim();
    const reservationTime = input.reservationTime.trim();
    const existingCount = await this.bookings.countBySlot(reservationDate, reservationTime);
    if (existingCount >= MAX_SLOT_CAPACITY) {
      throw new AppError("Selected time slot is fully booked.", 409, "SLOT_FULL");
    }

    const booking = await this.bookings.create({
      customerName: input.customerName.trim(),
      customerEmail: input.customerEmail.trim().toLowerCase(),
      partySize: input.partySize,
      reservationDate,
      reservationTime,
      notes: input.notes?.trim(),
      source: input.userId ? "registered" : "guest",
      userId: input.userId
    });

    this.logger.info("Booking created.", {
      bookingId: booking.id,
      reservationDate: booking.reservationDate,
      reservationTime: booking.reservationTime
    });

    return booking;
  }

  async listMine(userId: string) {
    return this.bookings.findAll({ userId });
  }

  async cancel(bookingId: string, userId: string) {
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
