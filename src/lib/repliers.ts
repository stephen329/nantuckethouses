const REPLIERS_BASE_URL = "https://api.repliers.io";

type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

/**
 * Make a request to the Repliers API with body (POST/PUT)
 */
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

  const url = new URL(`${REPLIERS_BASE_URL}${path}`);

  const res = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "REPLIERS-API-KEY": apiKey,
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

/**
 * Make a GET request to the Repliers API with query parameters
 * This is the preferred method for statistics requests per Repliers docs
 */
export async function repliersGet<T>(
  path: string,
  params: Record<string, string | number | boolean>
): Promise<T> {
  const apiKey = process.env.REPLIERS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing REPLIERS_API_KEY (not set in env)");
  }

  const url = new URL(`${REPLIERS_BASE_URL}${path}`);
  
  // Add query parameters
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, String(value));
  });

  const res = await fetch(url.toString(), {
    method: "GET",
    headers: {
      "REPLIERS-API-KEY": apiKey,
    },
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Repliers request failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<T>;
}
