import { env, isProduction } from "./env.ts";

/**
 * Small structured logger. Anything that looks like a credential is redacted
 * before it reaches stdout, so an accidental `logger.info("login", req.body)`
 * cannot leak a password or a token into the host's log drain.
 */

const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof LEVELS;

const threshold = LEVELS[env.LOG_LEVEL];

const SECRET_KEY = /(password|token|secret|key|authorization|cookie|credential|jwt|apikey)/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4) return "[deep]";
  if (value === null || typeof value !== "object") return value;
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));

  const out: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value as Record<string, unknown>)) {
    out[key] = SECRET_KEY.test(key) ? "[redacted]" : redact(item, depth + 1);
  }
  return out;
}

function write(level: Level, message: string, meta?: Record<string, unknown>) {
  if (LEVELS[level] < threshold) return;

  const entry = {
    time: new Date().toISOString(),
    level,
    message,
    ...(meta ? { meta: redact(meta) } : {}),
  };

  const line = isProduction ? JSON.stringify(entry) : `${level.toUpperCase()} ${message}`;
  const detail = !isProduction && meta ? redact(meta) : undefined;

  if (level === "error" || level === "warn") {
    console.error(line, detail ?? "");
  } else {
    console.log(line, detail ?? "");
  }
}

export const logger = {
  debug: (message: string, meta?: Record<string, unknown>) => write("debug", message, meta),
  info: (message: string, meta?: Record<string, unknown>) => write("info", message, meta),
  warn: (message: string, meta?: Record<string, unknown>) => write("warn", message, meta),
  error: (message: string, meta?: Record<string, unknown>) => write("error", message, meta),
};
