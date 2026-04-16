import jwt from "jsonwebtoken";
import { AuthTokenPayload, TokenService } from "../../application/services/TokenService";

export class JwtTokenService implements TokenService {
  constructor(private readonly secret: string) {}

  sign(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: "1d" });
  }

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, this.secret) as AuthTokenPayload;
  }
}
