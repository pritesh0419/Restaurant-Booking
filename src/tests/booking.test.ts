import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryBookingRepository } from "../repositories/InMemoryBookingRepository";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";
import { AdminBookingService } from "../services/AdminBookingService";
import { BookingService } from "../services/BookingService";
import { FakeLogger } from "./helpers/FakeLogger";
import { AppError } from "../utils/AppError";

test("creates a guest booking", async () => {
  const bookings = new InMemoryBookingRepository();
  const bookingService = new BookingService(bookings, new FakeLogger());

  const result = await bookingService.create({
    customerName: "Guest User",
    customerEmail: "guest@example.com",
    partySize: 4,
    reservationDate: "2026-05-01",
    reservationTime: "18:00"
  });

  assert.equal(result.source, "guest");
  assert.equal(result.status, "pending");
});

test("creates a registered user booking and lists it", async () => {
  const bookings = new InMemoryBookingRepository();
  const bookingService = new BookingService(bookings, new FakeLogger());

  const booking = await bookingService.create({
    customerName: "Registered User",
    customerEmail: "registered@example.com",
    partySize: 2,
    reservationDate: "2026-05-02",
    reservationTime: "19:00",
    userId: "user-123"
  });

  const results = await bookingService.listMine("user-123");

  assert.equal(booking.source, "registered");
  assert.equal(results.length, 1);
  assert.equal(results[0]?.id, booking.id);
});

test("prevents booking when a slot is full", async () => {
  const bookings = new InMemoryBookingRepository();
  const bookingService = new BookingService(bookings, new FakeLogger());

  for (let index = 0; index < 10; index += 1) {
    await bookingService.create({
      customerName: `Guest ${index}`,
      customerEmail: `guest${index}@example.com`,
      partySize: 2,
      reservationDate: "2026-05-03",
      reservationTime: "20:00"
    });
  }

  await assert.rejects(
    bookingService.create({
      customerName: "Overflow Guest",
      customerEmail: "overflow@example.com",
      partySize: 2,
      reservationDate: "2026-05-03",
      reservationTime: "20:00"
    }),
    (error: unknown) => error instanceof AppError && error.code === "SLOT_FULL"
  );
});

test("validates booking payload", async () => {
  const bookings = new InMemoryBookingRepository();
  const bookingService = new BookingService(bookings, new FakeLogger());

  await assert.rejects(
    bookingService.create({
      customerName: "",
      customerEmail: "",
      partySize: 0,
      reservationDate: "",
      reservationTime: ""
    }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR"
  );
});

test("allows a customer to cancel their own booking", async () => {
  const bookings = new InMemoryBookingRepository();
  const bookingService = new BookingService(bookings, new FakeLogger());

  const booking = await bookingService.create({
    customerName: "Customer",
    customerEmail: "customer@example.com",
    partySize: 3,
    reservationDate: "2026-05-04",
    reservationTime: "17:00",
    userId: "customer-1"
  });

  const cancelled = await bookingService.cancel(booking.id, "customer-1");
  assert.equal(cancelled.status, "cancelled");
});

test("prevents cancelling another user's booking", async () => {
  const bookings = new InMemoryBookingRepository();
  const bookingService = new BookingService(bookings, new FakeLogger());

  const booking = await bookingService.create({
    customerName: "Customer",
    customerEmail: "customer@example.com",
    partySize: 3,
    reservationDate: "2026-05-05",
    reservationTime: "17:00",
    userId: "customer-1"
  });

  await assert.rejects(
    bookingService.cancel(booking.id, "customer-2"),
    (error: unknown) => error instanceof AppError && error.code === "FORBIDDEN"
  );
});

test("rejects cancelling missing or already cancelled bookings", async () => {
  const bookings = new InMemoryBookingRepository();
  const bookingService = new BookingService(bookings, new FakeLogger());

  await assert.rejects(
    bookingService.cancel("missing-booking", "customer-1"),
    (error: unknown) => error instanceof AppError && error.code === "BOOKING_NOT_FOUND"
  );

  const booking = await bookingService.create({
    customerName: "Customer",
    customerEmail: "customer@example.com",
    partySize: 2,
    reservationDate: "2026-05-06",
    reservationTime: "17:30",
    userId: "customer-1"
  });

  await bookingService.cancel(booking.id, "customer-1");

  await assert.rejects(
    bookingService.cancel(booking.id, "customer-1"),
    (error: unknown) => error instanceof AppError && error.code === "BOOKING_CANCELLED"
  );
});

test("allows admin approval and analytics reporting", async () => {
  const bookings = new InMemoryBookingRepository();
  const users = new InMemoryUserRepository();
  const bookingService = new BookingService(bookings, new FakeLogger());
  const adminBookingService = new AdminBookingService(bookings, users, new FakeLogger());

  await users.create({
    name: "Admin",
    email: "admin@example.com",
    passwordHash: "hashed:secret12",
    role: "admin"
  });

  const booking = await bookingService.create({
    customerName: "Approved Customer",
    customerEmail: "approved@example.com",
    partySize: 5,
    reservationDate: "2026-05-06",
    reservationTime: "18:30"
  });

  const approved = await adminBookingService.updateBooking(booking.id, "admin-1", {
    status: "approved",
    reviewReason: "Table available"
  });

  const approvedBookings = await adminBookingService.listBookings({ status: "approved" });
  const summary = await adminBookingService.getAnalytics();

  assert.equal(approved.status, "approved");
  assert.equal(approved.reviewedBy, "admin-1");
  assert.equal(approvedBookings.length, 1);
  assert.equal(summary.approvedBookings, 1);
  assert.equal(summary.totalUsers, 1);
});

test("allows admin filtering and handles missing booking updates", async () => {
  const bookings = new InMemoryBookingRepository();
  const users = new InMemoryUserRepository();
  const adminBookingService = new AdminBookingService(bookings, users, new FakeLogger());

  const filtered = await adminBookingService.listBookings({ reservationDate: "2026-05-07" });
  assert.equal(filtered.length, 0);

  await assert.rejects(
    adminBookingService.updateBooking("missing-booking", "admin-1", { status: "approved" }),
    (error: unknown) => error instanceof AppError && error.code === "BOOKING_NOT_FOUND"
  );
});
