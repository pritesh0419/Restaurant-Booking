import { randomUUID } from "node:crypto";
import { Booking } from "../../domain/entities/Booking";
import {
  BookingAnalytics,
  BookingFilters,
  BookingRepository,
  CreateBookingInput,
  UpdateBookingInput
} from "../../domain/repositories/BookingRepository";

export class InMemoryBookingRepository implements BookingRepository {
  private readonly bookings = new Map<string, Booking>();

  async create(input: CreateBookingInput): Promise<Booking> {
    const now = new Date();
    const booking: Booking = {
      id: randomUUID(),
      customerName: input.customerName,
      customerEmail: input.customerEmail,
      partySize: input.partySize,
      reservationDate: input.reservationDate,
      reservationTime: input.reservationTime,
      notes: input.notes,
      status: "pending",
      source: input.source,
      userId: input.userId,
      createdAt: now,
      updatedAt: now
    };

    this.bookings.set(booking.id, booking);
    return booking;
  }

  async findById(id: string): Promise<Booking | null> {
    return this.bookings.get(id) ?? null;
  }

  async findAll(filters?: BookingFilters): Promise<Booking[]> {
    const results = Array.from(this.bookings.values()).filter((booking) => {
      if (filters?.userId && booking.userId !== filters.userId) {
        return false;
      }

      if (filters?.status && booking.status !== filters.status) {
        return false;
      }

      if (filters?.reservationDate && booking.reservationDate !== filters.reservationDate) {
        return false;
      }

      return true;
    });

    return results.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async update(id: string, input: UpdateBookingInput): Promise<Booking | null> {
    const existing = this.bookings.get(id);
    if (!existing) {
      return null;
    }

    const updated: Booking = {
      ...existing,
      ...input,
      updatedAt: new Date()
    };

    this.bookings.set(id, updated);
    return updated;
  }

  async countBySlot(reservationDate: string, reservationTime: string): Promise<number> {
    return Array.from(this.bookings.values()).filter(
      (booking) =>
        booking.reservationDate === reservationDate &&
        booking.reservationTime === reservationTime &&
        booking.status !== "declined" &&
        booking.status !== "cancelled"
    ).length;
  }

  async getAnalytics(): Promise<BookingAnalytics> {
    const counts: BookingAnalytics = {
      totalBookings: this.bookings.size,
      pendingBookings: 0,
      approvedBookings: 0,
      declinedBookings: 0,
      cancelledBookings: 0
    };

    for (const booking of this.bookings.values()) {
      if (booking.status === "pending") counts.pendingBookings += 1;
      if (booking.status === "approved") counts.approvedBookings += 1;
      if (booking.status === "declined") counts.declinedBookings += 1;
      if (booking.status === "cancelled") counts.cancelledBookings += 1;
    }

    return counts;
  }
}
