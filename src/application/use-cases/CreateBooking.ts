import { AppError } from "../errors/AppError";
import { Logger } from "../services/Logger";
import { BookingRepository } from "../../domain/repositories/BookingRepository";

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

export class CreateBooking {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly logger: Logger
  ) {}

  async execute(input: CreateBookingInput) {
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
}
