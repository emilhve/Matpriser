import { env } from "../config/env.js";
import { requireEnvValue } from "../config/env.js";

export class ApiError extends Error {
  constructor(message, { status, body } = {}) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

export async function requestApi(path, options = {}) {
  const url = new URL(path, `${env.apiBaseUrl}/`);
  appendQueryParams(url, options.query);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), env.apiTimeoutMs);

  const headers = {
    Accept: "application/json",
    ...buildAuthHeader(),
    ...options.headers
  };

  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      query: undefined,
      body: serializeBody(options.body),
      signal: controller.signal
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new ApiError(`API request failed with status ${response.status}`, {
        status: response.status,
        body
      });
    }

    return body;
  } catch (error) {
    if (error.name === "AbortError") {
      throw new ApiError(`API request timed out after ${env.apiTimeoutMs}ms`);
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function appendQueryParams(url, query = {}) {
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === "") {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== undefined && item !== null && item !== "") {
          url.searchParams.append(key, item);
        }
      }

      continue;
    }

    url.searchParams.set(key, serializeQueryValue(value));
  }
}

function serializeQueryValue(value) {
  if (typeof value === "boolean") {
    return value ? "1" : "0";
  }

  return value;
}

function buildAuthHeader() {
  const apiKey = requireEnvValue("API_KEY", env.apiKey);
  const value = env.apiAuthScheme
    ? `${env.apiAuthScheme} ${apiKey}`
    : apiKey;

  return {
    [env.apiAuthHeader]: value
  };
}

function serializeBody(body) {
  if (!body || typeof body === "string") {
    return body;
  }

  return JSON.stringify(body);
}

async function readResponseBody(response) {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
