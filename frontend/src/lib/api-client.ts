/**
 * The single place the website talks to the backend. Components never call
 * `fetch` directly — they go through the hooks in `src/hooks`, which go
 * through here.
 *
 * Only `VITE_API_BASE_URL` is read, and it is a public value by design (the
 * browser has to know where the API lives). No key, token or secret is
 * referenced anywhere in this bundle.
 */

const BASE_URL = (import.meta.env["VITE_API_BASE_URL"] ?? "http://localhost:5000").replace(
  /\/+$/,
  "",
);

const API_ROOT = `${BASE_URL}/api/v1/public`;

/** A failure the UI can show a customer, with the technical detail dropped. */
export class ApiError extends Error {
  readonly status: number;
  readonly isNotFound: boolean;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.isNotFound = status === 404;
  }
}

export type ListMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

type Envelope<T> = {
  success: boolean;
  data?: T;
  meta?: ListMeta;
  message?: string;
};

/** A page of results together with the metadata needed to ask for the next. */
export type Paged<T> = {
  items: T[];
  meta: ListMeta;
};

type RequestOptions = {
  signal?: AbortSignal;
  query?: Record<string, string | number | boolean | undefined>;
};

function withQuery(path: string, query: RequestOptions["query"]): string {
  if (!query) return `${API_ROOT}${path}`;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") params.set(key, String(value));
  }

  const search = params.toString();
  return search ? `${API_ROOT}${path}?${search}` : `${API_ROOT}${path}`;
}

async function send<T>(
  path: string,
  options: RequestOptions,
): Promise<{ data: T; meta: ListMeta | undefined }> {
  let response: Response;

  try {
    response = await fetch(withQuery(path, options.query), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: options.signal ?? null,
    });
  } catch (error) {
    // An aborted request is a navigation, not a failure — let callers ignore it.
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    throw new ApiError("We could not reach the store's server. Please try again.", 0);
  }

  let payload: Envelope<T> | null = null;
  try {
    payload = (await response.json()) as Envelope<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload?.success) {
    throw new ApiError(
      payload?.message ?? "Something went wrong loading this page.",
      response.status,
    );
  }

  return { data: payload.data as T, meta: payload.meta };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { data } = await send<T>(path, options);
  return data;
}

/**
 * Same request, but keeps the `meta` envelope the API already returns. The
 * collection and new-arrivals grids need `total` to know whether a "Load more"
 * button should exist at all.
 */
async function requestPage<T>(path: string, options: RequestOptions = {}): Promise<Paged<T>> {
  const { data, meta } = await send<T[]>(path, options);
  const items = data ?? [];

  return {
    items,
    meta: meta ?? {
      page: 1,
      limit: items.length,
      total: items.length,
      totalPages: 1,
    },
  };
}

export const api = { request, requestPage };
