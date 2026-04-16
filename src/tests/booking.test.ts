import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryBookingRepository } from "../infrastructure/repositories/InMemoryBookingRepository";
import { CreateBooking } from "../application/use-cases/CreateBooking";
import { CancelBooking } from "../application/use-cases/CancelBooking";
import { ListBookings } from "../application/use-cases/ListBookings";
import { AdminUpdateBooking } from "../application/use-cases/AdminUpdateBooking";
import { AdminListBookings } from "../application/use-cases/AdminListBookings";
import { GetBookingAnalytics } from "../application/use-cases/GetBookingAnalytics";
import { InMemoryUserRepository } from "../infrastructure/repositories/InMemoryUserRepository";
import { FakeLogger } from "./helpers/FakeLogger";
import { AppError } from "../application/errors/AppError";

test("creates a guest booking", async () => {
  const bookings = new InMemoryBookingRepository();
  const createBooking = new CreateBooking(bookings, new FakeLogger());

  const result = await createBooking.execute({
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
  const createBooking = new CreateBooking(bookings, new FakeLogger());
  const listBookings = new ListBookings(bookings);

  const booking = await createBooking.execute({
    customerName: "Registered User",
    customerEmail: "registered@example.com",
    partySize: 2,
    reservationDate: "2026-05-02",
    reservationTime: "19:00",
    userId: "user-123"
  });

  const results = await listBookings.execute("user-123");

  assert.equal(booking.source, "registered");
  assert.equal(results.length, 1);
  assert.equal(results[0]?.id, booking.id);
});

test("prevents booking when a slot is full", async () => {
  const bookings = new InMemoryBookingRepository();
  const createBooking = new CreateBooking(bookings, new FakeLogger());

  for (let index = 0; index < 10; index += 1) {
    await createBooking.execute({
      customerName: `Guest ${index}`,
      customerEmail: `guest${index}@example.com`,
      partySize: 2,
      reservationDate: "2026-05-03",
      reservationTime: "20:00"
    });
  }

  await assert.rejects(
    createBooking.execute({
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
  const createBooking = new CreateBooking(bookings, new FakeLogger());

  await assert.rejects(
    createBooking.execute({
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
  const createBooking = new CreateBooking(bookings, new FakeLogger());
  const cancelBooking = new CancelBooking(bookings, new FakeLogger());

  const booking = await createBooking.execute({
    customerName: "Customer",
    customerEmail: "customer@example.com",
    partySize: 3,
    reservationDate: "2026-05-04",
    reservationTime: "17:00",
    userId: "customer-1"
  });

  const cancelled = await cancelBooking.execute(booking.id, "customer-1");
  assert.equal(cancelled.status, "cancelled");
});

test("prevents cancelling another user's booking", async () => {
  const bookings = new InMemoryBookingRepository();
  const createBooking = new CreateBooking(bookings, new FakeLogger());
  const cancelBooking = new CancelBooking(bookings, new FakeLogger());

  const booking = await createBooking.execute({
    customerName: "Customer",
    customerEmail: "customer@example.com",
    partySize: 3,
    reservationDate: "2026-05-05",
    reservationTime: "17:00",
    userId: "customer-1"
  });

  await assert.rejects(
    cancelBooking.execute(booking.id, "customer-2"),
    (error: unknown) => error instanceof AppError && error.code === "FORBIDDEN"
  );
});

test("rejects cancelling missing or already cancelled bookings", async () => {
  const bookings = new InMemoryBookingRepository();
  const createBooking = new CreateBooking(bookings, new FakeLogger());
  const cancelBooking = new CancelBooking(bookings, new FakeLogger());

  await assert.rejects(
    cancelBooking.execute("missing-booking", "customer-1"),
    (error: unknown) => error instanceof AppError && error.code === "BOOKING_NOT_FOUND"
  );

  const booking = await createBooking.execute({
    customerName: "Customer",
    customerEmail: "customer@example.com",
    partySize: 2,
    reservationDate: "2026-05-06",
    reservationTime: "17:30",
    userId: "customer-1"
  });

  await cancelBooking.execute(booking.id, "customer-1");

  await assert.rejects(
    cancelBooking.execute(booking.id, "customer-1"),
    (error: unknown) => error instanceof AppError && error.code === "BOOKING_CANCELLED"
  );
});

test("allows admin approval and analytics reporting", async () => {
  const bookings = new InMemoryBookingRepository();
  const users = new InMemoryUserRepository();
  const createBooking = new CreateBooking(bookings, new FakeLogger());
  const adminUpdateBooking = new AdminUpdateBooking(bookings, new FakeLogger());
  const adminListBookings = new AdminListBookings(bookings);
  const analytics = new GetBookingAnalytics(bookings, users);

  await users.create({
    name: "Admin",
    email: "admin@example.com",
    passwordHash: "hashed:secret12",
    role: "admin"
  });

  const booking = await createBooking.execute({
    customerName: "Approved Customer",
    customerEmail: "approved@example.com",
    partySize: 5,
    reservationDate: "2026-05-06",
    reservationTime: "18:30"
  });

  const approved = await adminUpdateBooking.execute(booking.id, "admin-1", {
    status: "approved",
    reviewReason: "Table available"
  });

  const approvedBookings = await adminListBookings.execute({ status: "approved" });
  const summary = await analytics.execute();

  assert.equal(approved.status, "approved");
  assert.equal(approved.reviewedBy, "admin-1");
  assert.equal(approvedBookings.length, 1);
  assert.equal(summary.approvedBookings, 1);
  assert.equal(summary.totalUsers, 1);
});

test("allows admin filtering and handles missing booking updates", async () => {
  const bookings = new InMemoryBookingRepository();
  const adminListBookings = new AdminListBookings(bookings);
  const adminUpdateBooking = new AdminUpdateBooking(bookings, new FakeLogger());

  const filtered = await adminListBookings.execute({ reservationDate: "2026-05-07" });
  assert.equal(filtered.length, 0);

  await assert.rejects(
    adminUpdateBooking.execute("missing-booking", "admin-1", { status: "approved" }),
    (error: unknown) => error instanceof AppError && error.code === "BOOKING_NOT_FOUND"
  );
});
