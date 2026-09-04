/**
 * Every call the dashboard makes goes through here.
 *
 * Credentials are cookies the browser attaches automatically and JavaScript
 * cannot read — there is no token in this module, in localStorage, or anywhere
 * else in the bundle. On a 401 the client transparently refreshes once and
 * retries; if that fails it hands control to the auth layer to sign out.
 */

/**
 * Where the API is, from the browser's point of view.
 *
 * A built dashboard ALWAYS calls its own origin, and that is deliberate. The
 * deployment rewrites `/api/*` to the API (see `vercel.json`), so the session
 * cookie is stored against the dashboard's own hostname. A first-party cookie is
 * the only kind a browser will reliably keep: Chrome Incognito blocks
 * third-party cookies outright, Safari blocks them, Firefox partitions them, and
 * Chrome is phasing them out everywhere. An API on a separate domain therefore
 * cannot hold a session — login returns 200, the cookie is dropped on arrival,
 * and the next request is a 401. No cookie attribute can override that.
 *
 * `VITE_API_BASE_URL` is honoured in development only, where `vite dev` has no
 * such rewrite. In a production build this collapses to `""` at compile time, so
 * a stale or mistaken value in the hosting dashboard cannot reintroduce the
 * cross-site call. The API's address belongs in `vercel.json` — one place, which
 * cannot silently disagree with a second one.
 */
const BASE_URL = (
  import.meta.env.DEV ? (import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:5000") : ""
).replace(/\/+$/, "");

const API = `${BASE_URL}/api/v1`;

export class ApiError extends Error {
  readonly status: number;
  /** Field-level messages from the backend's Zod validation. */
  readonly fieldErrors: Record<string, string>;
  readonly details: unknown;

  constructor(message: string, status: number, errors?: unknown, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
    this.fieldErrors = {};

    if (Array.isArray(errors)) {
      for (const item of errors) {
        if (
          item &&
          typeof item === "object" &&
          "field" in item &&
          "message" in item &&
          typeof item.field === "string" &&
          typeof item.message === "string"
        ) {
          this.fieldErrors[item.field] = item.message;
        }
      }
    }
  }
}

type Envelope<T> = {
  success: boolean;
  data?: T;
  meta?: unknown;
  message?: string;
  errors?: unknown;
};

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  body?: unknown;
  /** Sent as multipart/form-data; the browser sets the boundary itself. */
  form?: FormData;
  query?: Record<string, string | number | boolean | undefined | null>;
  signal?: AbortSignal;
  /** Internal: stops a refresh loop. */
  skipRefresh?: boolean;
};

/** Called when a session cannot be recovered, so the app can send the user to /login. */
let onSessionLost: (() => void) | null = null;
export function setSessionLostHandler(handler: (() => void) | null) {
  onSessionLost = handler;
}

function buildUrl(path: string, query: RequestOptions["query"]): string {
  const url = `${API}${path}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== "") params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `${url}?${search}` : url;
}

async function send<T>(path: string, options: RequestOptions): Promise<{ data: T; meta?: unknown }> {
  const init: RequestInit = {
    method: options.method ?? "GET",
    // Sends and accepts the session cookies. Without this the API sees an
    // anonymous request and refuses.
    credentials: "include",
    headers: { Accept: "application/json" },
    signal: options.signal ?? null,
  };

  if (options.form) {
    init.body = options.form;
  } else if (options.body !== undefined) {
    init.headers = { ...init.headers, "Content-Type": "application/json" };
    init.body = JSON.stringify(options.body);
  }

  let response: Response;
  try {
    response = await fetch(buildUrl(path, options.query), init);
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("Could not reach the server. Check your connection.", 0);
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (response.status === 401 && !options.skipRefresh && !path.startsWith("/auth/")) {
    const recovered = await refreshSession();
    if (recovered) return send<T>(path, { ...options, skipRefresh: true });

    onSessionLost?.();
    throw new ApiError("Your session has expired. Please sign in again.", 401);
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message ?? "Something went wrong.",
      response.status,
      payload?.errors,
      payload,
    );
  }

  return { data: payload.data as T, meta: payload.meta };
}

async function refreshSession(): Promise<boolean> {
  try {
    const response = await fetch(`${API}/auth/refresh`, {
      method: "POST",
      credentials: "include",
      headers: { Accept: "application/json" },
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await send<T>(path, options);
  return data;
}

export async function apiRequestWithMeta<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta?: unknown }> {
  return send<T>(path, options);
}
