import test from "node:test";
import assert from "node:assert/strict";
import { authMiddleware } from "../presentation/middleware/authMiddleware";
import { requireRole } from "../presentation/middleware/requireRole";
import { FakeTokenService } from "./helpers/FakeTokenService";
import { AuthenticatedRequest } from "../presentation/http/types";
import { AppError } from "../application/errors/AppError";

test("auth middleware attaches a user for a valid token", async () => {
  const middleware = authMiddleware(new FakeTokenService());
  const request = {
    headers: {
      authorization: 'Bearer {"sub":"user-1","role":"customer","email":"user@example.com"}'
    }
  } as unknown as AuthenticatedRequest;

  let calledNext = false;

  middleware(request, {} as never, (error?: unknown) => {
    assert.equal(error, undefined);
    calledNext = true;
  });

  assert.equal(calledNext, true);
  assert.equal(request.user?.id, "user-1");
});

test("auth middleware rejects a missing token", async () => {
  const middleware = authMiddleware(new FakeTokenService());
  const request = { headers: {} } as unknown as AuthenticatedRequest;

  middleware(request, {} as never, (error?: unknown) => {
    assert.equal(error instanceof AppError, true);
    assert.equal((error as AppError).statusCode, 401);
  });
});

test("auth middleware rejects an invalid token", async () => {
  const middleware = authMiddleware(new FakeTokenService());
  const request = {
    headers: {
      authorization: "Bearer not-json"
    }
  } as unknown as AuthenticatedRequest;

  middleware(request, {} as never, (error?: unknown) => {
    assert.equal(error instanceof AppError, true);
    assert.equal((error as AppError).statusCode, 401);
  });
});

test("role middleware rejects non-admin users", async () => {
  const middleware = requireRole("admin");
  const request = {
    user: {
      id: "user-1",
      email: "user@example.com",
      role: "customer"
    }
  } as AuthenticatedRequest;

  middleware(request, {} as never, (error?: unknown) => {
    assert.equal(error instanceof AppError, true);
    assert.equal((error as AppError).code, "FORBIDDEN");
  });
});

test("role middleware requires an authenticated user", async () => {
  const middleware = requireRole("admin");
  const request = {} as AuthenticatedRequest;

  middleware(request, {} as never, (error?: unknown) => {
    assert.equal(error instanceof AppError, true);
    assert.equal((error as AppError).code, "UNAUTHORIZED");
  });
});
