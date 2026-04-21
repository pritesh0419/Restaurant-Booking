import { createLogger, format, transports } from "winston";
import { Logger } from "../services/Logger";

const logger = createLogger({
  level: "info",
  format: format.combine(format.timestamp(), format.json()),
  transports: [new transports.Console()]
});

export class WinstonLogger implements Logger {
  info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    logger.error(message, meta);
  }
}
