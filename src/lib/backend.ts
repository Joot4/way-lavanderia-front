import "server-only";

export class BackendError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown,
  ) {
    super(message);
    this.name = "BackendError";
  }
}

const FETCH_TIMEOUT_MS = 10_000;

export async function backendFetch(path: string, init?: RequestInit): Promise<Response> {
  const baseUrl = process.env.BACKEND_URL;
  const secret = process.env.BACKEND_ADMIN_SECRET;
  if (!baseUrl) throw new Error("BACKEND_URL is not set");
  if (!secret) throw new Error("BACKEND_ADMIN_SECRET is not set");

  const url = path.startsWith("http") ? path : `${baseUrl.replace(/\/$/, "")}${path}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      ...init,
      signal: init?.signal ?? controller.signal,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
        "X-Admin-Secret": secret,
      },
      cache: "no-store",
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

export async function backendJson<T = unknown>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await backendFetch(path, init);
  const text = await res.text();
  const body = text ? safeParse(text) : null;
  if (!res.ok) {
    throw new BackendError(
      `Backend ${res.status} on ${path}`,
      res.status,
      body ?? text,
    );
  }
  return body as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
