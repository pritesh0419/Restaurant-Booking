import express from "express";
import { env } from "./config/env";
import { WinstonLogger } from "./config/logger";
import { errorHandler } from "./middleware/errorHandler";
import { InMemoryBookingRepository } from "./repositories/InMemoryBookingRepository";
import { InMemoryUserRepository } from "./repositories/InMemoryUserRepository";
import { MongooseBookingRepository } from "./repositories/MongooseBookingRepository";
import { MongooseUserRepository } from "./repositories/MongooseUserRepository";
import { BookingRepository } from "./repositories/BookingRepository";
import { UserRepository } from "./repositories/UserRepository";
import { createRouter } from "./routes/createRouter";
import { AdminBookingService } from "./services/AdminBookingService";
import { AuthService } from "./services/AuthService";
import { BookingService } from "./services/BookingService";
import { BcryptPasswordHasher } from "./utils/BcryptPasswordHasher";
import { JwtTokenService } from "./utils/JwtTokenService";

const logger = new WinstonLogger();
const tokenService = new JwtTokenService(env.jwtSecret);
const passwordHasher = new BcryptPasswordHasher();

const userRepository: UserRepository = env.useInMemoryRepositories
  ? new InMemoryUserRepository()
  : new MongooseUserRepository();

const bookingRepository: BookingRepository = env.useInMemoryRepositories
  ? new InMemoryBookingRepository()
  : new MongooseBookingRepository();

const authService = new AuthService(userRepository, passwordHasher, tokenService, logger);
const bookingService = new BookingService(bookingRepository, logger);
const adminBookingService = new AdminBookingService(bookingRepository, userRepository, logger);

export const app = express();

app.use(express.json());
app.use(
  createRouter({
    authService,
    bookingService,
    adminBookingService,
    tokenService
  })
);
app.use(errorHandler(logger));
