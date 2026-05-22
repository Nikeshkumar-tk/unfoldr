import { fetchAuthSession } from "aws-amplify/auth";
import { getApiBaseUrl } from "./env";

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

async function authHeaders(): Promise<Record<string, string>> {
  const session = await fetchAuthSession();
  const token = session.tokens?.idToken?.toString();
  if (!token) {
    throw new ApiError(401, "No active session");
  }
  return {
    Authorization: `Bearer ${token}`,
  };
}

interface ApiOptions {
  /** Skip the Authorization header (use for unauthenticated endpoints). */
  unauthenticated?: boolean;
  /** JSON body. Will be stringified + Content-Type set automatically. */
  json?: unknown;
}

/**
 * Thin authed fetch wrapper. Adds the Cognito ID token, parses JSON,
 * surfaces structured errors via `ApiError`.
 */
export async function api<T = unknown>(
  method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const base = getApiBaseUrl();
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  const headers: Record<string, string> = {};
  if (!options.unauthenticated) {
    Object.assign(headers, await authHeaders());
  }
  let body: BodyInit | undefined;
  if (options.json !== undefined) {
    headers["Content-Type"] = "application/json";
    body = JSON.stringify(options.json);
  }

  const res = await fetch(url, { method, headers, body });
  const text = await res.text();
  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      parsed = text;
    }
  }

  if (!res.ok) {
    const message =
      (parsed && typeof parsed === "object" && "message" in parsed
        ? String((parsed as { message: unknown }).message)
        : null) ?? res.statusText;
    throw new ApiError(res.status, message, parsed);
  }

  return parsed as T;
}
