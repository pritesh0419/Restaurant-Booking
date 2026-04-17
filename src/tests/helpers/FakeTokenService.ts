import { AuthTokenPayload, TokenService } from "../../application/services/TokenService";

export class FakeTokenService implements TokenService {
  sign(payload: AuthTokenPayload): string {
    return JSON.stringify(payload);
  }

  verify(token: string): AuthTokenPayload {
    return JSON.parse(token) as AuthTokenPayload;
  }
}
