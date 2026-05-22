export enum HttpMethod {
  DELETE = "DELETE",
  GET = "GET",
  HEAD = "HEAD",
  OPTIONS = "OPTIONS",
  PATCH = "PATCH",
  POST = "POST",
  PUT = "PUT",
}

const HTTP_METHODS = new Set<string>(Object.values(HttpMethod));

/**
 * Parse a raw method string (case-insensitive) into the typed `HttpMethod` enum.
 * Returns `undefined` if the input isn't a recognized HTTP method.
 *
 * Use this when you want to handle an unknown method gracefully (e.g. a 405
 * response) rather than throw.
 */
export function parseHttpMethod(raw: string | undefined | null): HttpMethod | undefined {
  if (!raw) return undefined;
  const upper = raw.toUpperCase();
  return HTTP_METHODS.has(upper) ? (upper as HttpMethod) : undefined;
}

/**
 * Assert that a raw method string is one of the supported HttpMethod values.
 * Throws if not. Returns the typed enum value on success.
 *
 * Use this when you've already restricted the route to specific methods and
 * an unknown method indicates a misconfiguration (the assertion failing is a
 * server bug, not a client error).
 */
export function assertHttpMethod(raw: string | undefined | null): HttpMethod {
  const parsed = parseHttpMethod(raw);
  if (!parsed) {
    throw new Error(
      `Unsupported HTTP method: ${raw ?? "<missing>"}. Expected one of ${Object.values(HttpMethod).join(", ")}.`,
    );
  }
  return parsed;
}

/**
 * Narrow a method string to one of the lambda's declared allowed methods.
 * Returns the typed method if allowed, `undefined` otherwise — useful for
 * dispatching per-method logic inside a multi-method handler.
 */
export function matchAllowedMethod(
  raw: string | undefined | null,
  allowed: readonly HttpMethod[],
): HttpMethod | undefined {
  const parsed = parseHttpMethod(raw);
  if (!parsed) return undefined;
  return allowed.includes(parsed) ? parsed : undefined;
}
