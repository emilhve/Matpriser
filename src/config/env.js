import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

function loadDotEnv(filePath = ".env") {
  const absolutePath = resolve(process.cwd(), filePath);

  if (!existsSync(absolutePath)) {
    return;
  }

  const lines = readFileSync(absolutePath, "utf8").split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }

    const separatorIndex = trimmed.indexOf("=");

    if (separatorIndex === -1) {
      continue;
    }

    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim().replace(/^["']|["']$/g, "");

    if (key && process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

function readRequiredEnv(name) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function readOptionalEnv(name, fallback = "") {
  return process.env[name] ?? fallback;
}

function readNumberEnv(name, fallback) {
  const value = process.env[name];

  if (!value) {
    return fallback;
  }

  const numberValue = Number(value);

  if (!Number.isFinite(numberValue)) {
    throw new Error(`Environment variable ${name} must be a number`);
  }

  return numberValue;
}

loadDotEnv();

export const env = {
  apiBaseUrl: readOptionalEnv("API_BASE_URL", "https://kassal.app/api/v1").replace(/\/$/, ""),
  apiKey: readOptionalEnv("API_KEY"),
  apiAuthHeader: process.env.API_AUTH_HEADER || "Authorization",
  apiAuthScheme: process.env.API_AUTH_SCHEME ?? "Bearer",
  apiTimeoutMs: readNumberEnv("API_TIMEOUT_MS", 10000),
  geminiApiKey: readOptionalEnv("GEMINI_API_KEY"),
  geminiModel: readOptionalEnv("GEMINI_MODEL", "gemini-3.5-flash-lite"),
  geminiMaxOutputTokens: readNumberEnv("GEMINI_MAX_OUTPUT_TOKENS", 2500),
  geminiTemperature: readNumberEnv("GEMINI_TEMPERATURE", 0.9),
  port: readNumberEnv("PORT", 3000)
};

export function requireEnvValue(name, value) {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}
