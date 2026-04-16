import { AppError } from "../errors/AppError";
import { Logger } from "../services/Logger";
import { PasswordHasher } from "../services/PasswordHasher";
import { TokenService } from "../services/TokenService";
import { UserRepository } from "../../domain/repositories/UserRepository";

interface LoginInput {
  email: string;
  password: string;
}

export class LoginUser {
  constructor(
    private readonly users: UserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenService: TokenService,
    private readonly logger: Logger
  ) {}

  async execute(input: LoginInput) {
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
