/**
 * The LienGuard Free API as an injectable Fastify factory.
 *
 * `buildApp()` returns a configured instance without listening on a port, so
 * tests can use `app.inject()` (no real sockets) and production can call
 * `app.listen()`. This separation is what makes the HTTP layer fast to test.
 */
import Fastify, { type FastifyInstance } from "fastify";
import rateLimit from "@fastify/rate-limit";
import cors from "@fastify/cors";
import {
  calculateSchedule,
  CalculationError,
  supportedStates,
  type ClaimantRole,
  type DeadlineInput,
} from "@lienguard/core";
import { calculateRequestSchema, type CalculateRequest } from "./schema.js";

/**
 * Build a clean `DeadlineInput` from validated request data. Explicit
 * conditional spreads (rather than passing `undefined`) satisfy the core's
 * `exactOptionalPropertyTypes` contract and keep the payload minimal.
 */
function toDeadlineInput(data: CalculateRequest): DeadlineInput {
  return {
    state: data.state,
    role: data.role as ClaimantRole,
    firstFurnishingDate: data.firstFurnishingDate,
    ...(data.lastFurnishingDate ? { lastFurnishingDate: data.lastFurnishingDate } : {}),
    ...(data.completionDate ? { completionDate: data.completionDate } : {}),
    ...(data.noticeOfCompletionDate
      ? { noticeOfCompletionDate: data.noticeOfCompletionDate }
      : {}),
  };
}

export interface BuildOptions {
  /** Pass-through Fastify logger toggle; off by default for quiet tests. */
  logger?: boolean;
  /** Max requests per IP per window. Default 60. Lower it in tests. */
  rateLimitMax?: number;
  /** Rate-limit window (ms). Default 60000. */
  rateLimitWindowMs?: number;
  /**
   * Allowed CORS origins. Default: read `CORS_ORIGINS` env (comma-separated).
   * If neither is set, cross-origin browser requests are refused — safe by
   * default, never a wildcard.
   */
  corsOrigins?: string[];
  /**
   * Trust `X-Forwarded-*` from a reverse proxy. Must stay off unless a
   * trusted terminator overwrites those headers — otherwise clients can
   * spoof their IP and bypass per-IP rate limits.
   */
  trustProxy?: boolean;
}

function resolveCorsOrigins(options: BuildOptions): string[] {
  if (options.corsOrigins) return options.corsOrigins;
  const env = process.env["CORS_ORIGINS"];
  if (!env) return [];
  return env
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
}

function resolveTrustProxy(options: BuildOptions): boolean {
  if (options.trustProxy !== undefined) return options.trustProxy;
  const v = (process.env["TRUST_PROXY"] ?? "").trim().toLowerCase();
  return v === "1" || v === "true" || v === "yes";
}

export async function buildApp(options: BuildOptions = {}): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger ?? false,
    trustProxy: resolveTrustProxy(options),
  });

  // --- Security & cross-origin controls -----------------------------------
  await app.register(cors, {
    // Explicit allowlist only; empty list => no cross-origin access granted.
    origin: resolveCorsOrigins(options),
    methods: ["GET", "POST"],
  });

  await app.register(rateLimit, {
    max: options.rateLimitMax ?? 60,
    timeWindow: options.rateLimitWindowMs ?? 60_000,
    // Keep the throttle response in the same envelope shape as every other
    // error. `statusCode` must be set explicitly or Fastify serializes the
    // thrown error as a 500.
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: "RateLimitExceeded",
      message: `Rate limit exceeded. Try again in ${Math.ceil(context.ttl / 1000)}s.`,
    }),
  });

  // Liveness probe.
  app.get("/health", async () => ({ status: "ok" }));

  // Discoverability: which jurisdictions this build supports.
  app.get("/v1/states", async () => ({ states: supportedStates() }));

  // The core Free-tier endpoint.
  app.post("/v1/calculate", async (request, reply) => {
    const parsed = calculateRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: "ValidationError",
        message: "Request body failed validation.",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      });
    }

    try {
      const schedule = calculateSchedule(toDeadlineInput(parsed.data));
      return reply.status(200).send(schedule);
    } catch (err) {
      if (err instanceof CalculationError) {
        // Unsupported state is the client's fault (400); other calculation
        // errors are already prevented by schema validation but handled defensively.
        const status = err.code === "UNSUPPORTED_STATE" ? 400 : 422;
        return reply.status(status).send({
          error: err.code,
          message: err.message,
        });
      }
      request.log.error(err);
      return reply.status(500).send({
        error: "InternalError",
        message: "An unexpected error occurred.",
      });
    }
  });

  return app;
}
