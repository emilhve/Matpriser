import { createReadStream, existsSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve } from "node:path";
import { env } from "./config/env.js";
import { enrichMealPlanWithPrices } from "./services/ingredientPricing.js";
import { generateWeeklyRecipes } from "./services/gemini.js";

const publicDir = resolve(process.cwd(), "public");

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8"
};

const server = createServer(async (request, response) => {
  try {
    if (request.method === "POST" && request.url === "/api/meal-plan") {
      await handleMealPlanRequest(request, response);
      return;
    }

    if (request.method === "GET") {
      serveStaticFile(request, response);
      return;
    }

    sendJson(response, 405, { error: "Method not allowed" });
  } catch (error) {
    sendJson(response, 500, { error: error.message });
  }
});

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(`Port ${env.port} is already in use.`);
    console.error(`Stop the other server or run with another port, for example: $env:PORT=3001; npm.cmd start`);
    process.exitCode = 1;
    return;
  }

  throw error;
});

server.listen(env.port, () => {
  console.log(`Matpriser website running at http://localhost:${env.port}`);
});

async function handleMealPlanRequest(request, response) {
  const body = await readJsonBody(request);
  const mealPlan = await generateWeeklyRecipes(body);
  const pricedMealPlan = await enrichMealPlanWithPrices(mealPlan);

  sendJson(response, 200, pricedMealPlan);
}

function serveStaticFile(request, response) {
  const requestedPath = request.url === "/" ? "/index.html" : new URL(request.url, "http://localhost").pathname;
  const filePath = normalize(join(publicDir, requestedPath));

  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    sendJson(response, 404, { error: "Not found" });
    return;
  }

  response.writeHead(200, {
    "Content-Type": mimeTypes[extname(filePath)] || "application/octet-stream"
  });
  createReadStream(filePath).pipe(response);
}

function readJsonBody(request) {
  return new Promise((resolveBody, rejectBody) => {
    let rawBody = "";

    request.on("data", (chunk) => {
      rawBody += chunk;

      if (rawBody.length > 10_000) {
        request.destroy();
        rejectBody(new Error("Request body is too large"));
      }
    });

    request.on("end", () => {
      try {
        resolveBody(JSON.parse(rawBody || "{}"));
      } catch {
        rejectBody(new Error("Request body must be valid JSON"));
      }
    });

    request.on("error", rejectBody);
  });
}

function sendJson(response, status, body) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8"
  });
  response.end(JSON.stringify(body));
}
