import dotenv from "dotenv";

dotenv.config();

export const env = {
  port: Number(process.env.PORT ?? 3000),
  jwtSecret: process.env.JWT_SECRET ?? "development-secret",
  mongoUri: process.env.MONGO_URI ?? "",
  useInMemoryRepositories: process.env.USE_IN_MEMORY === "true" || !process.env.MONGO_URI
};
