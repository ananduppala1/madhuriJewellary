import type { PostgrestError } from "@supabase/supabase-js";
import { logger } from "../config/logger.js";
import { ApiError } from "../utils/ApiError.js";

/**
 * Postgres error codes are useful to us and dangerous to a client — they name
 * tables, columns and constraints. They are translated here into ordinary
 * sentences and logged (code only, never the message) for diagnosis.
 */
export function raise(error: PostgrestError, context: string): never {
  logger.error(`Database error: ${context}`, { code: error.code });

  switch (error.code) {
    case "23505":
      throw ApiError.conflict("That slug is already in use");
    case "23503":
      throw ApiError.badRequest("That record is still referenced by something else");
    case "23514":
      throw ApiError.badRequest("Some values are outside the allowed range");
    case "22P02":
      throw ApiError.badRequest("A supplied identifier is not valid");
    case "PGRST116":
      throw ApiError.notFound();
    default:
      throw ApiError.internal("The database could not complete that request");
  }
}

type Result<T> = { data: T | null; error: PostgrestError | null };

export function unwrap<T>(result: Result<T>, context: string): T {
  if (result.error) raise(result.error, context);
  if (result.data === null) throw ApiError.notFound();
  return result.data;
}

export function unwrapMaybe<T>(result: Result<T>, context: string): T | null {
  if (result.error) raise(result.error, context);
  return result.data;
}

export function unwrapList<T>(result: Result<T[]>, context: string): T[] {
  if (result.error) raise(result.error, context);
  return result.data ?? [];
}
