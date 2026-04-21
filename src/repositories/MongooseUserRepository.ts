import { User } from "../entities/User";
import { UserModel } from "../models";
import { CreateUserInput, UserRepository } from "./UserRepository";

function mapUser(document: {
  _id: { toString(): string };
  name: string;
  email: string;
  passwordHash: string;
  role: User["role"];
  createdAt: Date;
  updatedAt: Date;
}): User {
  return {
    id: document._id.toString(),
    name: document.name,
    email: document.email,
    passwordHash: document.passwordHash,
    role: document.role,
    createdAt: document.createdAt,
    updatedAt: document.updatedAt
  };
}

export class MongooseUserRepository implements UserRepository {
  async create(input: CreateUserInput): Promise<User> {
    const user = await UserModel.create(input);
    return mapUser(user.toObject({ versionKey: false }));
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await UserModel.findOne({ email }).exec();
    return user ? mapUser(user.toObject({ versionKey: false })) : null;
  }

  async findById(id: string): Promise<User | null> {
    const user = await UserModel.findById(id).exec();
    return user ? mapUser(user.toObject({ versionKey: false })) : null;
  }

  async count(): Promise<number> {
    return UserModel.countDocuments().exec();
  }
}
