import test from "node:test";
import assert from "node:assert/strict";
import { InMemoryUserRepository } from "../repositories/InMemoryUserRepository";
import { AuthService } from "../services/AuthService";
import { PlainTextPasswordHasher } from "./helpers/PlainTextPasswordHasher";
import { FakeTokenService } from "./helpers/FakeTokenService";
import { FakeLogger } from "./helpers/FakeLogger";
import { AppError } from "../utils/AppError";

test("registers a new customer and returns a token", async () => {
  const repository = new InMemoryUserRepository();
  const authService = new AuthService(
    repository,
    new PlainTextPasswordHasher(),
    new FakeTokenService(),
    new FakeLogger()
  );

  const result = await authService.register({
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
  const authService = new AuthService(
    repository,
    new PlainTextPasswordHasher(),
    new FakeTokenService(),
    new FakeLogger()
  );

  await authService.register({
    name: "First User",
    email: "duplicate@example.com",
    password: "secret12"
  });

  await assert.rejects(
    authService.register({
      name: "Second User",
      email: "duplicate@example.com",
      password: "secret12"
    }),
    (error: unknown) => error instanceof AppError && error.code === "USER_EXISTS"
  );
});

test("validates registration input", async () => {
  const repository = new InMemoryUserRepository();
  const authService = new AuthService(
    repository,
    new PlainTextPasswordHasher(),
    new FakeTokenService(),
    new FakeLogger()
  );

  await assert.rejects(
    authService.register({
      name: "",
      email: "",
      password: ""
    }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR"
  );

  await assert.rejects(
    authService.register({
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
  const authService = new AuthService(
    repository,
    passwordHasher,
    new FakeTokenService(),
    new FakeLogger()
  );

  await authService.register({
    name: "Admin",
    email: "admin@example.com",
    password: "secret12",
    role: "admin"
  });

  const result = await authService.login({
    email: "admin@example.com",
    password: "secret12"
  });

  assert.equal(result.user.role, "admin");
  assert.match(result.token, /admin@example.com/);
});

test("rejects invalid login credentials", async () => {
  const repository = new InMemoryUserRepository();
  const passwordHasher = new PlainTextPasswordHasher();
  const authService = new AuthService(
    repository,
    passwordHasher,
    new FakeTokenService(),
    new FakeLogger()
  );

  await authService.register({
    name: "User",
    email: "user@example.com",
    password: "secret12"
  });

  await assert.rejects(
    authService.login({
      email: "user@example.com",
      password: "wrong-password"
    }),
    (error: unknown) => error instanceof AppError && error.statusCode === 401
  );
});

test("requires login input and rejects unknown users", async () => {
  const repository = new InMemoryUserRepository();
  const authService = new AuthService(
    repository,
    new PlainTextPasswordHasher(),
    new FakeTokenService(),
    new FakeLogger()
  );

  await assert.rejects(
    authService.login({
      email: "",
      password: ""
    }),
    (error: unknown) => error instanceof AppError && error.code === "VALIDATION_ERROR"
  );

  await assert.rejects(
    authService.login({
      email: "missing@example.com",
      password: "secret12"
    }),
    (error: unknown) => error instanceof AppError && error.code === "INVALID_CREDENTIALS"
  );
});
