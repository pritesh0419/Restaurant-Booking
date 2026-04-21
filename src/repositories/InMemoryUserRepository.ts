import { randomUUID } from "node:crypto";
import { User } from "../entities/User";
import { CreateUserInput, UserRepository } from "./UserRepository";

export class InMemoryUserRepository implements UserRepository {
  users = new Map<string, User>();

  async create(input: CreateUserInput): Promise<User> {
    const now = new Date();
    const user: User = {
      id: randomUUID(),
      name: input.name,
      email: input.email,
      passwordHash: input.passwordHash,
      role: input.role,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(user.id, user);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }

    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.users.get(id) ?? null;
  }

  async count(): Promise<number> {
    return this.users.size;
  }
}
