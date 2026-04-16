import { Booking, BookingStatus } from "../entities/Booking";

export interface CreateBookingInput {
  customerName: string;
  customerEmail: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  notes?: string;
  source: Booking["source"];
  userId?: string;
}

export interface BookingFilters {
  userId?: string;
  status?: BookingStatus;
  reservationDate?: string;
}

export interface UpdateBookingInput {
  customerName?: string;
  customerEmail?: string;
  partySize?: number;
  reservationDate?: string;
  reservationTime?: string;
  notes?: string;
  status?: BookingStatus;
  reviewedBy?: string;
  reviewReason?: string;
}

export interface BookingAnalytics {
  totalBookings: number;
  pendingBookings: number;
  approvedBookings: number;
  declinedBookings: number;
  cancelledBookings: number;
}

export interface BookingRepository {
  create(input: CreateBookingInput): Promise<Booking>;
  findById(id: string): Promise<Booking | null>;
  findAll(filters?: BookingFilters): Promise<Booking[]>;
  update(id: string, input: UpdateBookingInput): Promise<Booking | null>;
  countBySlot(reservationDate: string, reservationTime: string): Promise<number>;
  getAnalytics(): Promise<BookingAnalytics>;
}
