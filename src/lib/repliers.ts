const REPLIERS_BASE_URL = "https://api.repliers.io";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export async function repliersFetch<T>(
  path: string,
  options: {
    method?: HttpMethod;
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<T> {
  const apiKey = process.env.REPLIERS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing REPLIERS_API_KEY (not set in env)");
  }

  const { method = "GET", body, headers = {} } = options;

  // Add api_key as a query param (some gateways are strict on header parsing).
  const url = new URL(`${REPLIERS_BASE_URL}${path}`);
  url.searchParams.set("api_key", apiKey);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      // Send both casings to be safe with upstream header handling.
      "x-api-key": apiKey,
      "X-API-KEY": apiKey,
      ...headers,
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Repliers request failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}
