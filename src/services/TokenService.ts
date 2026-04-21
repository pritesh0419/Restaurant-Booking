export interface AuthTokenPayload {
  sub: string;
  role: string;
  email: string;
}

export interface TokenService {
  sign(payload: AuthTokenPayload): string;
  verify(token: string): AuthTokenPayload;
}
