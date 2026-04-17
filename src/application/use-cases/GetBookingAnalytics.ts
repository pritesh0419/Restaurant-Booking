import { BookingRepository } from "../../domain/repositories/BookingRepository";
import { UserRepository } from "../../domain/repositories/UserRepository";

export class GetBookingAnalytics {
  constructor(
    private readonly bookings: BookingRepository,
    private readonly users: UserRepository
  ) {}

  async execute() {
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
