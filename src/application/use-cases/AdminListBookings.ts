import { BookingRepository, BookingFilters } from "../../domain/repositories/BookingRepository";

export class AdminListBookings {
  constructor(private readonly bookings: BookingRepository) {}

  async execute(filters?: BookingFilters) {
    return this.bookings.findAll(filters);
  }
}
