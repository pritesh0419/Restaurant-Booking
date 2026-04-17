import { Logger } from "../../application/services/Logger";

export class FakeLogger implements Logger {
  info(): void {}
  warn(): void {}
  error(): void {}
}
