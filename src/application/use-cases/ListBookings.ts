import { BookingRepository } from "../../domain/repositories/BookingRepository";

export class ListBookings {
  constructor(private readonly bookings: BookingRepository) {}

  async execute(userId: string) {
    return this.bookings.findAll({ userId });
  }
}
