import { app } from "./app";
import { connectToDatabase } from "./config/database";
import { env } from "./config/env";

async function start() {
  if (!env.useInMemoryRepositories && env.mongoUri) {
    await connectToDatabase(env.mongoUri);
  }

  app.listen(env.port, () => {
    console.log(`Server running on port ${env.port}`);
  });
}

start().catch((error: Error) => {
  console.error("Failed to start server.", error.message);
  process.exit(1);
});
