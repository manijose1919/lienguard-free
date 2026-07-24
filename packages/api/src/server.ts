/**
 * Production entrypoint: build the app and bind a port.
 *
 * Configuration comes from the environment so nothing host-specific is baked
 * into the image:
 *   PORT  — port to listen on (default 3000)
 *   HOST  — interface to bind   (default 0.0.0.0)
 */
import { buildApp } from "./app.js";

const port = Number(process.env["PORT"] ?? 3000);
const host = process.env["HOST"] ?? "0.0.0.0";

async function main(): Promise<void> {
  const app = await buildApp({ logger: true });
  try {
    const address = await app.listen({ port, host });
    app.log.info(`LienGuard Free API listening on ${address}`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
}

void main();
