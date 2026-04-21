import { PasswordHasher } from "../../services/PasswordHasher";

export class PlainTextPasswordHasher implements PasswordHasher {
  async hash(value: string): Promise<string> {
    return `hashed:${value}`;
  }

  async compare(value: string, hash: string): Promise<boolean> {
    return hash === `hashed:${value}`;
  }
}
