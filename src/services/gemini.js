import { env, requireEnvValue } from "../config/env.js";

const maxRecipeGenerationAttempts = 3;
const preparedFormPattern =
  /\b(hardkokt|hardkokte|bløtkokt|bløtkokte|kokt|kokte|stekt|stekte|revet|revne|hakket|hakkede|skivet|skivede|terningkuttet|strimlet|strimlede|most|moset|bakt|bakte|grillet|grillede)\b/;
const allowedPreparedGroceryTerms = new Set([
  "hakkede tomater",
  "knuste tomater",
  "revet ost"
]);

const mealPlanSchema = {
  type: "object",
  properties: {
    recipes: {
      type: "array",
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          type: {
            type: "string",
            enum: ["meat", "chicken", "fish", "vegetarian"]
          },
          servings: { type: "integer" },
          ingredients: {
            type: "array",
            maxItems: 5,
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                searchTerm: { type: "string" },
                amount: { type: "number" },
                unit: { type: "string" }
              },
              required: ["name", "searchTerm", "amount", "unit"]
            }
          },
          steps: {
            type: "array",
            items: { type: "string" }
          }
        },
        required: ["title", "type", "servings", "ingredients", "steps"]
      }
    }
  },
  required: ["recipes"]
};

class RecipePlanValidationError extends Error {
  constructor(message) {
    super(message);
    this.name = "RecipePlanValidationError";
  }
}

export async function generateWeeklyRecipes(mealCounts) {
  validateMealCounts(mealCounts);

  const apiKey = requireEnvValue("GEMINI_API_KEY", env.geminiApiKey);
  let prompt = buildRecipePrompt(mealCounts);
  for (let attempt = 1; attempt <= maxRecipeGenerationAttempts; attempt += 1) {
    const text = await requestGeminiRecipeText(apiKey, prompt);

    try {
      return parseAndValidateMealPlan(text, mealCounts);
    } catch (error) {
      if (!(error instanceof RecipePlanValidationError)) {
        throw error;
      }

      if (attempt < maxRecipeGenerationAttempts) {
        prompt = buildRecipeRepairPrompt({
          mealCounts,
          validationError: error.message,
          previousResponseText: text
        });
      }
    }
  }

  throw new Error(
    `Gemini could not generate a valid meal plan after ${maxRecipeGenerationAttempts} attempts. Please try again.`
  );
}

async function requestGeminiRecipeText(apiKey, prompt) {
  const response = await fetch(buildGeminiUrl(apiKey), {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: prompt }]
        }
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: mealPlanSchema,
        temperature: env.geminiTemperature,
        maxOutputTokens: env.geminiMaxOutputTokens
      }
    })
  });

  const body = await response.json();

  if (!response.ok) {
    throw new Error(body.error?.message || `Gemini request failed with status ${response.status}`);
  }

  const text = body.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    throw new Error("Gemini returned no recipe text");
  }

  return text;
}

function parseAndValidateMealPlan(text, mealCounts) {
  let mealPlan;

  try {
    mealPlan = JSON.parse(text);
  } catch {
    throwRecipePlanValidationError("Gemini returned invalid JSON");
  }

  validateMealPlan(mealPlan, mealCounts);

  return mealPlan;
}

export function validateMealCounts(mealCounts) {
  const keys = ["meat", "chicken", "fish", "vegetarian"];
  const total = keys.reduce((sum, key) => {
    const value = mealCounts[key];

    if (!Number.isInteger(value) || value < 0 || value > 7) {
      throw new Error(`Meal count for ${key} must be an integer from 0 to 7`);
    }

    return sum + value;
  }, 0);

  if (total !== 7) {
    throw new Error("Meal counts must add up to 7");
  }
}

function buildGeminiUrl(apiKey) {
  const model = encodeURIComponent(env.geminiModel);
  const url = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`
  );

  url.searchParams.set("key", apiKey);
  return url;
}

function buildRecipePrompt(mealCounts) {
  return `
Generate a simple 7-day Norwegian dinner plan.

Meal distribution:
- Meat dinners: ${mealCounts.meat}
- Chicken dinners: ${mealCounts.chicken}
- Fish dinners: ${mealCounts.fish}
- Vegetarian dinners: ${mealCounts.vegetarian}

Rules:
- Return exactly 7 recipes.
- Keep recipes very simple, realistic, and budget friendly.
- Make the 7 recipes noticeably different from each other.
- Vary the cooking style and base ingredients across the week, for example pan meal, oven dish, soup, pasta, rice bowl, taco-style, stew, salad bowl, or fish dinner.
- Do not repeat the same main ingredient more than twice in the same weekly plan.
- Do not return the same common default recipes every time. Choose a balanced mix of familiar Norwegian everyday dinners.
- Use only basic ingredients that are easy to find in normal Norwegian grocery stores.
- Do not use specialty ingredients, niche spices, uncommon sauces, or hard-to-find products.
- Avoid desserts, snacks, cakes, candy, and breakfast foods.
- Ingredient names and searchTerm values must be in Norwegian.
- Every ingredient must include:
  - name: the basic grocery item or standard packaged grocery product name for the user, in Norwegian.
  - searchTerm: a simple Norwegian grocery search term for Kassalapp.
- searchTerm rules:
  - Use one basic grocery item only.
  - Use 1 to 3 words.
  - Do not use brand names.
  - Do not use descriptive phrases.
  - Do not use cooking/preparation instructions like "revet gulrot", "kokt ris", "hardkokte egg", "stekt kylling", or "hakket løk".
  - Use the grocery item instead, for example "gulrot", "ris", "egg", "kyllingfilet", or "løk".
  - Standard packaged grocery products are allowed when they are commonly sold that way, for example "hakkede tomater" or "revet ost".
  - Do not use recipe-specific wording.
  - Do not combine ingredients, for example "ris og grønnsaker".
  - Prefer searchable terms like "kyllingfilet", "ris", "torsk", "poteter", "gulrot", "tomater", or "kjøttdeig".
- Use a maximum of 5 ingredients per recipe.
- Do not count water, salt, pepper, or neutral cooking oil as ingredients.
- Use servings: 2 for every recipe.
- Keep each step short.
`.trim();
}

function buildRecipeRepairPrompt({ mealCounts, validationError, previousResponseText }) {
  return `
The previous recipe JSON failed validation and must be corrected.

Validation error:
${validationError}

Meal distribution must still be:
- Meat dinners: ${mealCounts.meat}
- Chicken dinners: ${mealCounts.chicken}
- Fish dinners: ${mealCounts.fish}
- Vegetarian dinners: ${mealCounts.vegetarian}

Fix the JSON so it follows every rule below:
- Return exactly 7 recipes.
- Keep every recipe at a maximum of 5 ingredients.
- Ingredient name and searchTerm must be grocery product names, not cooking instructions.
- Replace prepared ingredient wording with grocery-product wording.
- Examples:
  - "Grillet kylling" must become "kyllingfilet" or another raw chicken grocery product.
  - "Hardkokte egg" must become "egg".
  - "Revet gulrot" must become "gulrot".
  - "Hakket løk" must become "løk".
  - "Hakkede tomater" is allowed because it is a common packaged grocery product.
- searchTerm must be 1 to 3 words and useful for Kassalapp product search.
- Do not include explanations. Return only corrected JSON.

Previous invalid JSON:
${previousResponseText}
`.trim();
}

function validateMealPlan(mealPlan, mealCounts) {
  if (!Array.isArray(mealPlan.recipes) || mealPlan.recipes.length !== 7) {
    throwRecipePlanValidationError("Gemini response must contain exactly 7 recipes");
  }

  const actualCounts = {
    meat: 0,
    chicken: 0,
    fish: 0,
    vegetarian: 0
  };
  const recipeTitles = new Set();

  for (const recipe of mealPlan.recipes) {
    if (!Object.hasOwn(actualCounts, recipe.type)) {
      throwRecipePlanValidationError(`Unexpected recipe type: ${recipe.type}`);
    }

    const normalizedTitle = String(recipe.title || "").trim().toLowerCase();

    if (!normalizedTitle) {
      throwRecipePlanValidationError("Recipe title cannot be empty");
    }

    if (recipeTitles.has(normalizedTitle)) {
      throwRecipePlanValidationError(`Duplicate recipe title: ${recipe.title}`);
    }

    recipeTitles.add(normalizedTitle);

    if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length > 5) {
      throwRecipePlanValidationError(`Recipe "${recipe.title}" has more than 5 ingredients`);
    }

    for (const ingredient of recipe.ingredients) {
      validateIngredientSearchTerm(ingredient, recipe.title);
    }

    actualCounts[recipe.type] += 1;
  }

  for (const [key, expected] of Object.entries(mealCounts)) {
    if (actualCounts[key] !== expected) {
      throwRecipePlanValidationError(`Expected ${expected} ${key} recipes, got ${actualCounts[key]}`);
    }
  }
}

function validateIngredientSearchTerm(ingredient, recipeTitle) {
  validateRawIngredientName(ingredient, recipeTitle);

  const searchTerm = ingredient.searchTerm;

  if (typeof searchTerm !== "string" || !searchTerm.trim()) {
    throwRecipePlanValidationError(`Recipe "${recipeTitle}" has an ingredient without a searchTerm`);
  }

  const normalized = searchTerm.trim().toLowerCase();
  const words = normalized.split(/\s+/);
  const combinedIngredientPattern = /\b(og|eller|med)\b|[,/&+]/;

  if (words.length > 3) {
    throwRecipePlanValidationError(`Search term "${searchTerm}" is too long`);
  }

  if (combinedIngredientPattern.test(normalized)) {
    throwRecipePlanValidationError(`Search term "${searchTerm}" looks like multiple ingredients`);
  }

  if (looksLikeInvalidPreparedIngredient(normalized)) {
    throwRecipePlanValidationError(`Search term "${searchTerm}" looks like a prepared ingredient`);
  }
}

function validateRawIngredientName(ingredient, recipeTitle) {
  const name = ingredient.name;

  if (typeof name !== "string" || !name.trim()) {
    throwRecipePlanValidationError(`Recipe "${recipeTitle}" has an ingredient without a name`);
  }

  if (looksLikeInvalidPreparedIngredient(name.trim().toLowerCase())) {
    throwRecipePlanValidationError(`Ingredient "${name}" should use a grocery product name`);
  }
}

function looksLikeInvalidPreparedIngredient(value) {
  return preparedFormPattern.test(value) && !allowedPreparedGroceryTerms.has(value);
}

function throwRecipePlanValidationError(message) {
  throw new RecipePlanValidationError(message);
}
