import { describe, expect, it } from "vitest";

import {
  badRequest,
  conflict,
  notFound,
  serverError,
  success,
  unauthorized
} from "@/app/api/_lib/responses";

describe("api responses helpers", () => {
  it("builds standard error payloads and status codes", async () => {
    const res = badRequest("nope", { reason: "x" });
    expect(res.status).toBe(400);
    await expect(res.json()).resolves.toMatchObject({
      code: "bad_request",
      message: "nope",
      details: { reason: "x" }
    });

    const res404 = notFound();
    expect(res404.status).toBe(404);
    await expect(res404.json()).resolves.toMatchObject({
      code: "not_found",
      message: "Not Found"
    });

    const res401 = unauthorized("no", { where: "header" });
    expect(res401.status).toBe(401);
    await expect(res401.json()).resolves.toMatchObject({
      code: "unauthorized",
      message: "no",
      details: { where: "header" }
    });

    const res500 = serverError();
    expect(res500.status).toBe(500);
    await expect(res500.json()).resolves.toMatchObject({
      code: "internal_error",
      message: "Internal Server Error"
    });
  });

  it("normalizes conflict details when shape matches", async () => {
    const res = conflict("Conflict", {
      currentHash: "abc",
      currentMtime: 123,
      currentUpdatedAt: "2025-01-01T00:00:00+08:00",
      field: "title",
      ignored: true
    });

    expect(res.status).toBe(409);
    await expect(res.json()).resolves.toMatchObject({
      code: "conflict",
      message: "Conflict",
      details: {
        currentHash: "abc",
        currentMtime: 123,
        currentUpdatedAt: "2025-01-01T00:00:00+08:00",
        field: "title"
      }
    });
  });

  it("passes through non-object conflict details and drops empty objects", async () => {
    const resString = conflict("Conflict", "raw");
    await expect(resString.json()).resolves.toMatchObject({
      code: "conflict",
      message: "Conflict",
      details: "raw"
    });

    const resEmpty = conflict("Conflict", { foo: "bar" });
    const body = await resEmpty.json();
    expect(body).toMatchObject({ code: "conflict", message: "Conflict" });
    expect(body).not.toHaveProperty("details");
  });

  it("supports success responses", async () => {
    const res = success({ ok: true }, { status: 201 });
    expect(res.status).toBe(201);
    await expect(res.json()).resolves.toEqual({ ok: true });
  });
});
