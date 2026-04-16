export type BookingStatus = "pending" | "approved" | "declined" | "cancelled";
export type BookingSource = "guest" | "registered";

export interface Booking {
  id: string;
  customerName: string;
  customerEmail: string;
  partySize: number;
  reservationDate: string;
  reservationTime: string;
  notes?: string;
  status: BookingStatus;
  source: BookingSource;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
  reviewedBy?: string;
  reviewReason?: string;
}
