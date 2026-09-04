import { createApp } from "./app.ts";
import { warmCache } from "./cache/cache.warm.ts";
import { env } from "./config/env.ts";
import { logger } from "./config/logger.ts";
import { closeRedis, initRedis } from "./config/redis.ts";

// Opened once, before the first request, and shared by every handler. A cache
// that dialled Redis per request would be slower than the database it fronts.
initRedis();

const app = createApp();

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
