import app from "./app.js";
import { warmCache } from "./cache/cache.warm.js";
import { assertEnvOrExit, env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { closeRedis, initRedis } from "./config/redis.js";

/**
 * Long-lived server entry point: `npm run dev`, `npm start`, a container, a VPS.
 *
 * Vercel never loads this file - it uses `src/index.ts`, which exports the same
 * app without binding a port. Everything here is the part of running an API
 * that only makes sense when there is a process to keep alive: a port, a signal
 * handler, a graceful shutdown.
 *
 * Configuration is validated strictly here. A long-lived process that boots
 * half-configured will fail on its first real request instead, which is a far
 * worse place to find out.
 */
assertEnvOrExit();

// Opened once, before the first request, and shared by every handler. A cache
// that dialled Redis per request would be slower than the database it fronts.
initRedis();

const server = app.listen(env.PORT, () => {
  logger.info("API listening", { port: env.PORT, env: env.NODE_ENV });

  if (env.CACHE_WARM_ON_STARTUP) {
    void warmCache().catch(() => {
      /* Warming is best-effort; the error is already logged. */
    });
  }
});

/** Let in-flight requests finish, then close Redis, before the process exits. */
function shutdown(signal: string) {
  logger.info("Shutting down", { signal });

  server.close(() => {
    void closeRedis().finally(() => process.exit(0));
  });

  // Hard stop if something refuses to let go.
  setTimeout(() => {
    void closeRedis().finally(() => process.exit(1));
  }, 10_000).unref();
}

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

process.on("unhandledRejection", (reason) => {
  logger.error("Unhandled promise rejection", {
    message: reason instanceof Error ? reason.message : String(reason),
  });
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception", { message: error.message });
  shutdown("uncaughtException");
});
