import { Booking } from "../../domain/entities/Booking";
import {
  BookingAnalytics,
  BookingFilters,
  BookingRepository,
  CreateBookingInput,
  UpdateBookingInput
} from "../../domain/repositories/BookingRepository";
import { BookingModel } from "../database/mongoose/schemas";

function mapBooking(document: {
  _id: { toString(): string };
  customerName: string;
  customerEmail: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  notes?: string | null;
  status: Booking["status"];
  source: Booking["source"];
  userId?: string | null;
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: string | null;
  reviewReason?: string | null;
}): Booking {
  return {
    id: document._id.toString(),
    customerName: document.customerName,
    customerEmail: document.customerEmail,
    partySize: document.partySize,
    reservationDate: document.reservationDate,
    reservationTime: document.reservationTime,
    notes: document.notes ?? undefined,
    status: document.status,
    source: document.source,
    userId: document.userId ?? undefined,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt,
    reviewedBy: document.reviewedBy ?? undefined,
    reviewReason: document.reviewReason ?? undefined
  };
}

export class MongooseBookingRepository implements BookingRepository {
  async create(input: CreateBookingInput): Promise<Booking> {
    const booking = await BookingModel.create(input);
    return mapBooking(booking.toObject({ versionKey: false }));
  }

  async findById(id: string): Promise<Booking | null> {
    const booking = await BookingModel.findById(id).exec();
    return booking ? mapBooking(booking.toObject({ versionKey: false })) : null;
  }

  async findAll(filters?: BookingFilters): Promise<Booking[]> {
    const bookings = await BookingModel.find(filters ?? {}).sort({ createdAt: 1 }).exec();
    return bookings.map((booking) => mapBooking(booking.toObject({ versionKey: false })));
  }

  async update(id: string, input: UpdateBookingInput): Promise<Booking | null> {
    const booking = await BookingModel.findByIdAndUpdate(id, input, { new: true }).exec();
    return booking ? mapBooking(booking.toObject({ versionKey: false })) : null;
  }

  async countBySlot(reservationDate: string, reservationTime: string): Promise<number> {
    return BookingModel.countDocuments({
      reservationDate,
      reservationTime,
      status: { $nin: ["declined", "cancelled"] }
    }).exec();
  }

  async getAnalytics(): Promise<BookingAnalytics> {
    const [totalBookings, pendingBookings, approvedBookings, declinedBookings, cancelledBookings] =
      await Promise.all([
        BookingModel.countDocuments().exec(),
        BookingModel.countDocuments({ status: "pending" }).exec(),
        BookingModel.countDocuments({ status: "approved" }).exec(),
        BookingModel.countDocuments({ status: "declined" }).exec(),
        BookingModel.countDocuments({ status: "cancelled" }).exec()
      ]);

    return {
      totalBookings,
      pendingBookings,
      approvedBookings,
      declinedBookings,
      cancelledBookings
    };
  }
}
