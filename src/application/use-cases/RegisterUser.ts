import { AppError } from "../errors/AppError";
import { Logger } from "../services/Logger";
import { PasswordHasher } from "../services/PasswordHasher";
import { TokenService } from "../services/TokenService";
import { UserRepository } from "../../domain/repositories/UserRepository";
import { UserRole } from "../../domain/entities/User";

interface RegisterInput {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}

export class RegisterUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly logger: Logger
  ) {}

  async execute(input: RegisterInput) {
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
}
