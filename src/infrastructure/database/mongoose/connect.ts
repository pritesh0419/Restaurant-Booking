import mongoose from "mongoose";

export async function connectToDatabase(connectionString: string): Promise<void> {
  await mongoose.connect(connectionString);
}
