import test from "node:test";
import assert from "node:assert/strict";
import { RegisterUser } from "../application/use-cases/RegisterUser";
import { LoginUser } from "../application/use-cases/LoginUser";
import { InMemoryUserRepository } from "../infrastructure/repositories/InMemoryUserRepository";
import { PlainTextPasswordHasher } from "./helpers/PlainTextPasswordHasher";
import { FakeTokenService } from "./helpers/FakeTokenService";
import { FakeLogger } from "./helpers/FakeLogger";
import { AppError } from "../application/errors/AppError";

test("registers a new customer and returns a token", async () => {
  const repository = new InMemoryUserRepository();
  const registerUser = new RegisterUser(
    repository,
    new PlainTextPasswordHasher(),
    new FakeTokenService(),
    new FakeLogger()
  );

  const result = await registerUser.execute({
    name: "Nirma",
    email: "nirma@example.com",
    password: "secret12"
  });

  assert.equal(result.user.email, "nirma@example.com");
  assert.equal(result.user.role, "customer");
  assert.match(result.token, /nirma@example.com/);
});

test("prevents duplicate registration", async () => {
  const repository = new InMemoryUserRepository();
  const registerUser = new RegisterUser(
    repository,
    new PlainTextPasswordHasher(),
    new FakeTokenService(),
    new FakeLogger()
  );

  await registerUser.execute({
    name: "First User",
    email: "duplicate@example.com",
    password: "secret12"
  });

  await assert.rejects(
    registerUser.execute({
      name: "Second User",
      email: "duplicate@example.com",
      password: "secret12"
    }),
    (error: unknown) => error instanceof AppError && error.code === "USER_EXISTS"
  );
});

test("validates registration input", async () => {
  const repository = new InMemoryUserRepository();
  const registerUser = new RegisterUser(
    repository,
    new PlainTextPasswordHasher(),
    new FakeTokenService(),
    new FakeLogger()
  );

  await assert.rejects(
    registerUser.execute({
      name: "",
      email: "",
      password: ""
    }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR"
  );

  await assert.rejects(
    registerUser.execute({
      name: "Short Password",
      email: "short@example.com",
      password: "123"
    }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR"
  );
});

test("logs in a registered user", async () => {
  const repository = new InMemoryUserRepository();
  const passwordHasher = new PlainTextPasswordHasher();
  const registerUser = new RegisterUser(
    repository,
    passwordHasher,
    new FakeTokenService(),
    new FakeLogger()
  );

  await registerUser.execute({
    name: "Admin",
    email: "admin@example.com",
    password: "secret12",
    role: "admin"
  });

  const loginUser = new LoginUser(
    repository,
    passwordHasher,
    new FakeTokenService(),
    new FakeLogger()
  );

  const result = await loginUser.execute({
    email: "admin@example.com",
    password: "secret12"
  });

  assert.equal(result.user.role, "admin");
  assert.match(result.token, /admin@example.com/);
});

test("rejects invalid login credentials", async () => {
  const repository = new InMemoryUserRepository();
  const passwordHasher = new PlainTextPasswordHasher();
  const registerUser = new RegisterUser(
    repository,
    passwordHasher,
    new FakeTokenService(),
    new FakeLogger()
  );

  await registerUser.execute({
    name: "User",
    email: "user@example.com",
    password: "secret12"
  });

  const loginUser = new LoginUser(
    repository,
    passwordHasher,
    new FakeTokenService(),
    new FakeLogger()
  );

  await assert.rejects(
    loginUser.execute({
      email: "user@example.com",
      password: "wrong-password"
    }),
    (error: unknown) => error instanceof AppError && error.statusCode === 401
  );
});

test("requires login input and rejects unknown users", async () => {
  const repository = new InMemoryUserRepository();
  const loginUser = new LoginUser(
    repository,
    new PlainTextPasswordHasher(),
    new FakeTokenService(),
    new FakeLogger()
  );

  await assert.rejects(
    loginUser.execute({
      email: "",
      password: ""
    }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR"
  );

  await assert.rejects(
    loginUser.execute({
      email: "missing@example.com",
      password: "secret12"
    }),
    (error: unknown) => error instanceof AppError && error.code === "INVALID_CREDENTIALS"
  );
});
