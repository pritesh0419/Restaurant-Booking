import jwt from "jsonwebtoken";
import { AuthTokenPayload, TokenService } from "../services/TokenService";

export class JwtTokenService implements TokenService {
  secret: string;

  constructor(secret: string) {
    this.secret = secret;
  }

  sign(payload: AuthTokenPayload): string {
    return jwt.sign(payload, this.secret, { expiresIn: "1d" });
  }

  verify(token: string): AuthTokenPayload {
    return jwt.verify(token, this.secret) as AuthTokenPayload;
  }
}
