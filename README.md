# Matpriser

Starter structure for a project that talks to the Kassalapp API.

## Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Fill in your Kassalapp API token in `.env`.
4. Run the app:

```bash
npm start
```

Search products by passing a search term:

```bash
npm start melk
```

## Environment

```bash
API_BASE_URL=https://kassal.app/api/v1
API_KEY=replace-with-your-kassalapp-token
API_AUTH_HEADER=Authorization
API_AUTH_SCHEME=Bearer
API_TIMEOUT_MS=10000
```

For APIs that use a header such as `X-API-Key`, set:

```bash
API_AUTH_HEADER=X-API-Key
API_AUTH_SCHEME=
```

## Structure

```text
src/
  config/
    env.js          Loads and validates environment variables
  lib/
    apiClient.js    Reusable HTTP client with auth, JSON parsing, timeout, and errors
  services/
    kassalapp.js    Functions for the endpoints in api-specification.json
  index.js          Starter entry point
```

## Useful Commands

```bash
npm run check
npm start
```

## Next Questions

- What do you want the first feature to do with the API response?
- Should this become a command-line script, a backend API, or a web app?
