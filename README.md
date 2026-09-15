# Matpriser

Starter structure for a meal planner that uses Gemini for recipe generation and Kassalapp for grocery product data.

## Setup

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Fill in your Kassalapp and Gemini API keys in `.env`.
4. Run the website/backend:

```bash
npm.cmd start
```

Open `http://localhost:3000` in your browser.

Search Kassalapp products from the command line:

```bash
npm.cmd run cli melk
```

## Environment

```bash
API_BASE_URL=https://kassal.app/api/v1
API_KEY=replace-with-your-kassalapp-token
API_AUTH_HEADER=Authorization
API_AUTH_SCHEME=Bearer
API_TIMEOUT_MS=10000

GEMINI_API_KEY=replace-with-your-gemini-api-key
GEMINI_MODEL=gemini-3.5-flash-lite
GEMINI_MAX_OUTPUT_TOKENS=2500
GEMINI_TEMPERATURE=0.9
PORT=3000
```

## Gemini Free-Tier Setup

The app is set up conservatively for Gemini's free tier:

- The Gemini key is only used by the local backend, never by browser JavaScript.
- The default model is `gemini-3.5-flash-lite`.
- Recipe generation uses one Gemini request per weekly plan.
- Output is capped with `GEMINI_MAX_OUTPUT_TOKENS=2500`.
- The request uses structured JSON so the app does not need extra cleanup calls.
- No grounding, Google Search, Maps, tools, or batch features are enabled.

## Structure

```text
src/
  config/
    env.js          Loads and validates environment variables
  lib/
    apiClient.js    Reusable HTTP client with auth, JSON parsing, timeout, and errors
  services/
    kassalapp.js    Functions for the endpoints in api-specification.json
    gemini.js       Free-tier-minded Gemini recipe generation
  data/
    dinnerCategories.js  Dinner-related category IDs discovered from Kassalapp
  server.js         Local backend and static file server
  index.js          Starter entry point
```

Dinner category IDs can be imported like this:

```js
import {
  dinnerCategoryGroups,
  dinnerCategoryIds,
  dinnerCategoryById
} from "./src/data/dinnerCategories.js";
```

## Useful Commands

```bash
npm run check
npm test
npm start
```

## Website Prototype

Run `npm.cmd start`, then open `http://localhost:3000` in a browser. After generating recipes, the app opens `/recipes.html` with seven restaurant-style order tickets.

The `/api/meal-plan` response includes Kassalapp product matches for each ingredient when a confident match is found. Meal totals use basket cost, meaning the actual product/package price the user would pay.

## Next Questions

- What do you want the first feature to do with the API response?
- Should this become a command-line script, a backend API, or a web app?
