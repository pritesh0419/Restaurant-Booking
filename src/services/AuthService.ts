import { UserRole } from "../entities/User";
import { UserRepository } from "../repositories/UserRepository";
import { AppError } from "../utils/AppError";
import { Logger } from "./Logger";
import { PasswordHasher } from "./PasswordHasher";
import { TokenService } from "./TokenService";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  users: UserRepository;
  passwordHasher: PasswordHasher;
  tokenService: TokenService;
  logger: Logger;

  constructor(
    users: UserRepository,
    passwordHasher: PasswordHasher,
    tokenService: TokenService,
    logger: Logger
  ) {
    this.users = users;
    this.passwordHasher = passwordHasher;
    this.tokenService = tokenService;
    this.logger = logger;
  }

  async register(input: RegisterInput) {
    if (!input.name || !input.email || !input.password) {
      throw new AppError("Name, email, and password are required.", 400, "VALIDATION_ERROR");
    }

    if (input.password.length < 6) {
      throw new AppError("Password must be at least 6 characters.", 400, "VALIDATION_ERROR");
    }

    const email = input.email.trim().toLowerCase();
    const existingUser = await this.users.findByEmail(email);
    if (existingUser) {
      throw new AppError("A user with this email already exists.", 409, "USER_EXISTS");
    }

    const passwordHash = await this.passwordHasher.hash(input.password);
    const role = input.role ?? "customer";
    const user = await this.users.create({
      name: input.name.trim(),
      email,
      passwordHash,
      role
    });

    const token = this.tokenService.sign({
      sub: user.id,
      role: user.role,
      email: user.email
    });

    this.logger.info("User registered.", { userId: user.id, role: user.role });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }

  async login(input: LoginInput) {
    if (!input.email || !input.password) {
      throw new AppError("Email and password are required.", 400, "VALIDATION_ERROR");
    }

    const user = await this.users.findByEmail(input.email.trim().toLowerCase());
    if (!user) {
      throw new AppError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
    }

    const passwordMatches = await this.passwordHasher.compare(input.password, user.passwordHash);
    if (!passwordMatches) {
      throw new AppError("Invalid credentials.", 401, "INVALID_CREDENTIALS");
    }

    const token = this.tokenService.sign({
      sub: user.id,
      role: user.role,
      email: user.email
    });

    this.logger.info("User logged in.", { userId: user.id });

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      },
      token
    };
  }
}
