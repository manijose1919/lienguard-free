import { describe, it, expect, beforeAll, afterAll } from "vitest";
import type { FastifyInstance } from "fastify";
import { buildApp } from "./app.js";

let app: FastifyInstance;

beforeAll(async () => {
  app = await buildApp();
  await app.ready();
});

afterAll(async () => {
  await app.close();
});

describe("GET /health", () => {
  it("reports ok", async () => {
    const res = await app.inject({ method: "GET", url: "/health" });
    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: "ok" });
  });
});

describe("GET /v1/states", () => {
  it("lists the loaded jurisdictions", async () => {
    const res = await app.inject({ method: "GET", url: "/v1/states" });
    expect(res.statusCode).toBe(200);
    expect(res.json().states).toEqual(expect.arrayContaining(["CA", "FL", "TX"]));
  });
});

describe("POST /v1/calculate", () => {
  it("returns a computed schedule for a valid request", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate",
      payload: {
        state: "CA",
        role: "subcontractor",
        firstFurnishingDate: "2025-03-03",
      },
    });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.state).toBe("CA");
    expect(body.items.some((i: { ruleId: string }) => i.ruleId === "ca-preliminary-notice")).toBe(
      true,
    );
    expect(body.disclaimer).toMatch(/not legal advice/i);
    expect(body.meta.engineVersion).toBeTruthy();
  });

  it("uppercases a lowercase state code", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate",
      payload: { state: "ca", role: "laborer", firstFurnishingDate: "2025-03-03" },
    });
    expect(res.statusCode).toBe(200);
    expect(res.json().state).toBe("CA");
  });

  it("rejects a missing required field with 400 and issue detail", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate",
      payload: { state: "CA", role: "subcontractor" },
    });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error).toBe("ValidationError");
    expect(body.issues.some((i: { path: string }) => i.path === "firstFurnishingDate")).toBe(true);
  });

  it("rejects an invalid role", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate",
      payload: { state: "CA", role: "architect", firstFurnishingDate: "2025-03-03" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects an impossible date", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate",
      payload: { state: "CA", role: "subcontractor", firstFurnishingDate: "2025-02-30" },
    });
    expect(res.statusCode).toBe(400);
  });

  it("rejects unknown fields (strict schema)", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate",
      payload: {
        state: "CA",
        role: "subcontractor",
        firstFurnishingDate: "2025-03-03",
        sneaky: "value",
      },
    });
    expect(res.statusCode).toBe(400);
  });

  it("returns 400 for an unsupported (well-formed) state", async () => {
    const res = await app.inject({
      method: "POST",
      url: "/v1/calculate",
      payload: { state: "ZZ", role: "subcontractor", firstFurnishingDate: "2025-03-03" },
    });
    expect(res.statusCode).toBe(400);
    expect(res.json().error).toBe("UNSUPPORTED_STATE");
  });
});

describe("security controls", () => {
  it("throttles after the configured limit, in the standard error envelope", async () => {
    // Dedicated app instance with a tiny limit so the test is fast & isolated.
    const limited = await buildApp({ rateLimitMax: 2, rateLimitWindowMs: 60_000 });
    await limited.ready();
    try {
      const call = () => limited.inject({ method: "GET", url: "/health" });
      expect((await call()).statusCode).toBe(200);
      expect((await call()).statusCode).toBe(200);
      const throttled = await call();
      expect(throttled.statusCode).toBe(429);
      expect(throttled.json().error).toBe("RateLimitExceeded");
      expect(throttled.json().message).toMatch(/Rate limit exceeded/);
    } finally {
      await limited.close();
    }
  });

  it("echoes an allowlisted CORS origin and omits a non-listed one", async () => {
    const scoped = await buildApp({ corsOrigins: ["https://app.lienguard.io"] });
    await scoped.ready();
    try {
      const allowed = await scoped.inject({
        method: "GET",
        url: "/health",
        headers: { origin: "https://app.lienguard.io" },
      });
      expect(allowed.headers["access-control-allow-origin"]).toBe("https://app.lienguard.io");

      const denied = await scoped.inject({
        method: "GET",
        url: "/health",
        headers: { origin: "https://evil.example" },
      });
      expect(denied.headers["access-control-allow-origin"]).toBeUndefined();
    } finally {
      await scoped.close();
    }
  });
});
