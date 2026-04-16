  import express from "express";
import { BcryptPasswordHasher } from "./infrastructure/auth/BcryptPasswordHasher";
import { JwtTokenService } from "./infrastructure/auth/JwtTokenService";
import { WinstonLogger } from "./infrastructure/logging/WinstonLogger";
import { InMemoryUserRepository } from "./infrastructure/repositories/InMemoryUserRepository";
import { InMemoryBookingRepository } from "./infrastructure/repositories/InMemoryBookingRepository";
import { MongooseUserRepository } from "./infrastructure/repositories/MongooseUserRepository";
import { MongooseBookingRepository } from "./infrastructure/repositories/MongooseBookingRepository";
import { RegisterUser } from "./application/use-cases/RegisterUser";
import { LoginUser } from "./application/use-cases/LoginUser";
import { CreateBooking } from "./application/use-cases/CreateBooking";
import { ListBookings } from "./application/use-cases/ListBookings";
import { CancelBooking } from "./application/use-cases/CancelBooking";
import { AdminListBookings } from "./application/use-cases/AdminListBookings";
import { AdminUpdateBooking } from "./application/use-cases/AdminUpdateBooking";
import { GetBookingAnalytics } from "./application/use-cases/GetBookingAnalytics";
import { createRouter } from "./presentation/routes/createRouter";
import { errorHandler } from "./presentation/middleware/errorHandler";
import { env } from "./config/env";
import { UserRepository } from "./domain/repositories/UserRepository";
import { BookingRepository } from "./domain/repositories/BookingRepository";

const logger = new WinstonLogger();
const tokenService = new JwtTokenService(env.jwtSecret);
const passwordHasher = new BcryptPasswordHasher();

const userRepository: UserRepository = env.useInMemoryRepositories
  ? new InMemoryUserRepository()
  : new MongooseUserRepository();

const bookingRepository: BookingRepository = env.useInMemoryRepositories
  ? new InMemoryBookingRepository()
  : new MongooseBookingRepository();

const registerUser = new RegisterUser(userRepository, passwordHasher, tokenService, logger);
const loginUser = new LoginUser(userRepository, passwordHasher, tokenService, logger);
const createBooking = new CreateBooking(bookingRepository, logger);
const listBookings = new ListBookings(bookingRepository);
const cancelBooking = new CancelBooking(bookingRepository, logger);
const adminListBookings = new AdminListBookings(bookingRepository);
const adminUpdateBooking = new AdminUpdateBooking(bookingRepository, logger);
const getBookingAnalytics = new GetBookingAnalytics(bookingRepository, userRepository);

export const app = express();

app.use(express.json());
app.use(
  createRouter({
    registerUser,
    loginUser,
    createBooking,
    listBookings,
    cancelBooking,
    adminListBookings,
    adminUpdateBooking,
    getBookingAnalytics,
    tokenService
  })
);
app.use(errorHandler(logger));
