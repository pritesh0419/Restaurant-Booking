import { Schema, model } from "mongoose";

const bookingSchema = new Schema(
  {
    customerName: { type: String, required: true, trim: true },
    customerEmail: { type: String, required: true, lowercase: true, trim: true },
    partySize: { type: Number, required: true, min: 1, max: 12 },
    reservationDate: { type: String, required: true },
    reservationTime: { type: String, required: true },
    notes: { type: String },
    status: {
      type: String,
      enum: ["pending", "approved", "declined", "cancelled"],
      default: "pending"
    },
    source: { type: String, enum: ["guest", "registered"], required: true },
    userId: { type: String },
    reviewedBy: { type: String },
    reviewReason: { type: String }
  },
  { timestamps: true }
);

bookingSchema.index({ reservationDate: 1, reservationTime: 1 });

export const BookingModel = model("Booking", bookingSchema);
