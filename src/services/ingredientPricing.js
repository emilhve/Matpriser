import { searchProducts } from "./kassalapp.js";

const maxConcurrentSearches = 4;
const dessertCategoryIds = new Set([164, 404, 879]);
const blockedCategoryWords = [
  "dessert",
  "dessertis",
  "godteri",
  "sjokolade",
  "kjeks",
  "lakris",
  "snacks",
  "chips",
  "ferdigmåltid",
  "ferdigmaltid",
  "ferdigretter"
];
const blockedProductWords = [
  "dessert",
  "dessertis",
  "godteri",
  "sjokolade",
  "lakris",
  "snacks",
  "chips",
  "småis",
  "smais"
];
const categoryHintsBySearchTerm = new Map([
  ["brød", 23],
  ["brod", 23],
  ["egg", 8],
  ["lettmelk", 179],
  ["helmelk", 299],
  ["matfløte", 501],
  ["matflote", 501],
  ["kremfløte", 227],
  ["kremflote", 227],
  ["rømme", 152],
  ["romme", 152],
  ["creme fraiche", 302],
  ["gulost", 433],
  ["hvitost", 433],
  ["norvegia", 433],
  ["revet ost", 19],
  ["smør", 230],
  ["smor", 230],
  ["rapsolje", 343],
  ["olivenolje", 427],
  ["hvitløk økologisk", 29],
  ["hvitlok okologisk", 29],
  ["løk", 29],
  ["lok", 29],
  ["gulrot", 21],
  ["gulrot 1kg", 21],
  ["agurk", 90],
  ["paprika", 45],
  ["salat", 55],
  ["brokkoli", 12],
  ["blomkål", 12],
  ["blomkal", 12],
  ["tomater", 149],
  ["hakkede tomater", 66],
  ["knuste tomater", 66],
  ["poteter", 31],
  ["potetmos", 158],
  ["ris", 606],
  ["basmatiris", 606],
  ["jasminris", 606],
  ["kyllingfilet", 354],
  ["kyllinglår", 48],
  ["kyllinglar", 48],
  ["kyllingvinger", 622],
  ["kyllingkjøttdeig", 463],
  ["kyllingkjottdeig", 463],
  ["kjøttdeig", 169],
  ["kjottdeig", 169],
  ["karbonadedeig", 190],
  ["storfekjøtt", 392],
  ["storfekjott", 392],
  ["svinekjøtt", 173],
  ["svinekjott", 173],
  ["laks", 108],
  ["torsk", 182],
  ["fiskekaker", 270],
  ["fiskepinner", 472],
  ["tunfisk i vann", 8652],
  ["tunfisk i olje", 8079],
  ["reker", 229],
  ["bønner", 546],
  ["bonner", 546],
  ["linser", 267],
  ["kikerter", 8770],
  ["tofu", 5037],
  ["mais", 340],
  ["spinat", 11],
  ["sopp", 319],
  ["champignon", 319],
  ["tomatpure", 220],
  ["tomatpuré", 220],
  ["pastasaus", 294],
  ["pasta", 142],
  ["spagetti", 143],
  ["spaghetti", 143],
  ["makaroni", 218],
  ["nudler", 34],
  ["tacoskjell", 131],
  ["tortillalefser", 262],
  ["tacokit", 564]
]);
const searchAliasesBySearchTerm = new Map([
  ["melk", ["lettmelk", "helmelk"]],
  ["fløte", ["matfløte", "kremfløte"]],
  ["flote", ["matfløte", "kremfløte"]],
  ["ost", ["hvitost", "gulost"]],
  ["olje", ["rapsolje", "olivenolje"]],
  ["hvitløk", ["hvitløk økologisk"]],
  ["hvitlok", ["hvitløk økologisk"]],
  ["tunfisk", ["tunfisk i vann", "tunfisk i olje"]],
  ["gulrot", ["gulrot 1kg"]],
  ["erter", ["grønne erter"]],
  ["pasta", ["spagetti", "makaroni", "pastaskruer"]]
]);
const rejectedProductTermsBySearchTerm = new Map([
  ["melk", ["pølse", "polse", "sjokolade", "morsmelk"]],
  ["fløte", ["fløtepotet", "fløteis", "saus", "topping"]],
  ["flote", ["flotepotet", "floteis", "saus", "topping"]],
  ["rømme", ["dressing", "grøt", "grot", "peanøtt", "peanott"]],
  ["creme fraiche", ["dressing"]],
  ["ost", ["gatorade", "frost", "postei", "saus"]],
  ["smør", ["peanøtt", "peanott", "smøreost", "smoreost", "smørbrød", "smorbrod", "sandefjord"]],
  ["olje", ["babyolje", "grillolje"]],
  ["hvitløk", ["baguett", "dressing", "pastasaus", "krutong", "pulver", "salt", "pepper", "ost", "oliven"]],
  ["hvitlok", ["baguett", "dressing", "pastasaus", "krutong", "pulver", "salt", "pepper", "ost", "oliven"]],
  ["gulrot", ["kake", "brød", "brod", "suppe", "marsipan", "strimlet"]],
  ["salat", ["potetsalat", "påleggsalat", "paleggsalat", "skinkesalat", "wakame"]],
  ["brokkoli", ["salat", "suppe", "sandwich"]],
  ["blomkål", ["suppe", "ris"]],
  ["blomkal", ["suppe", "ris"]],
  ["erter", ["kikerter", "dessert"]],
  ["bønner", ["kaffe"]],
  ["bonner", ["kaffe"]],
  ["mais", ["småis", "smais", "mel", "olje"]],
  ["spinat", ["suppe", "flette"]],
  ["sopp", ["suppe", "saus"]],
  ["champignon", ["suppe"]],
  ["kjøttdeig", ["grønnsaker", "gronnsaker", "saus", "krydder", "kylling"]],
  ["kjottdeig", ["grønnsaker", "gronnsaker", "saus", "krydder", "kylling"]],
  ["kyllingfilet", ["marinert", "spiseklar", "bacon", "tomat", "urter", "hvitløk", "hvitlok", "pepper"]],
  ["kyllinglår", ["marinert", "hvitløk", "hvitlok", "pepper", "bbq"]],
  ["kyllinglar", ["marinert", "hvitløk", "hvitlok", "pepper", "bbq"]],
  ["tomater", ["basilikum", "oregano", "soltørket", "soltorket"]],
  ["brød", ["pølsebrød", "polsebrod", "hamburgerbrød", "hamburgerbrod", "skolebrød", "skolebrod", "wienerbrød", "wienerbrod"]]
]);

export async function enrichMealPlanWithPrices(mealPlan) {
  const searchCache = new Map();

  const recipes = await mapWithConcurrency(mealPlan.recipes, maxConcurrentSearches, async (recipe) => {
    const ingredients = await mapWithConcurrency(
      recipe.ingredients,
      maxConcurrentSearches,
      async (ingredient) => ({
        ...ingredient,
        productMatch: await findCheapestProductForIngredient(ingredient, searchCache)
      })
    );

    return {
      ...recipe,
      ingredients,
      basketTotal: roundCurrency(
        ingredients.reduce((total, ingredient) => total + (ingredient.productMatch?.basketCost || 0), 0)
      )
    };
  });

  return {
    ...mealPlan,
    recipes
  };
}

export async function findCheapestProductForIngredient(ingredient, searchCache = new Map()) {
  const searchTerm = String(ingredient.searchTerm || ingredient.name || "").trim();

  if (searchTerm.length < 3) {
    return null;
  }

  try {
    const productGroups = await searchProductGroupsWithCache(searchTerm, searchCache);

    for (const products of productGroups) {
      const match = selectBestProductForIngredient(products, ingredient);

      if (match) {
        return match;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export function selectBestProductForIngredient(products, ingredient) {
  const searchTerm = String(ingredient.searchTerm || ingredient.name || "").trim();
  const candidates = products
    .filter(isUsableProduct)
    .filter((product) => !isBlockedDinnerProduct(product))
    .filter((product) => !hasRejectedProductTerm(product, searchTerm))
    .map((product) => buildProductCandidate(product, ingredient, searchTerm))
    .filter((candidate) => candidate.relevanceScore > 0)
    .sort(compareCandidates);

  return candidates[0]?.productMatch || null;
}

async function searchProductGroupsWithCache(searchTerm, searchCache) {
  const queryGroups = buildSearchQueryGroups(searchTerm);
  const productGroups = [];

  for (const queryGroup of queryGroups) {
    const productsById = new Map();

    for (const query of queryGroup) {
      const cacheKey = JSON.stringify(query);

      if (!searchCache.has(cacheKey)) {
        searchCache.set(cacheKey, searchProducts(query).then((result) => result.data || []));
      }

      const products = await searchCache.get(cacheKey);
      for (const product of products) {
        productsById.set(product.id, product);
      }
    }

    productGroups.push([...productsById.values()]);
  }

  return productGroups;
}

function buildSearchQueryGroups(searchTerm) {
  const terms = [searchTerm, ...(searchAliasesBySearchTerm.get(normalizeText(searchTerm)) || [])];
  const categoryQueries = [];
  const aliasQueries = [];
  const fallbackQueries = [];

  for (const term of terms) {
    const categoryId = getCategoryIdHint(term);

    if (categoryId) {
      categoryQueries.push({
        search: term,
        size: 100,
        exclude_without_ean: true,
        category_id: categoryId
      });
    }

    const query = {
      search: term,
      size: 100,
      exclude_without_ean: true
    };

    if (term === searchTerm) {
      fallbackQueries.push(query);
    } else {
      aliasQueries.push(query);
    }
  }

  return [categoryQueries, aliasQueries, fallbackQueries].filter((group) => group.length);
}

function isUsableProduct(product) {
  return (
    Number.isFinite(product.current_price) &&
    product.current_price > 0 &&
    getPrimaryStore(product)
  );
}

function isBlockedDinnerProduct(product) {
  const categories = product.category || [];
  const productName = String(product.name || "").toLowerCase();

  if (blockedProductWords.some((word) => productName.includes(word))) {
    return true;
  }

  return categories.some((category) => {
    const name = String(category.name || "").toLowerCase();

    return dessertCategoryIds.has(category.id) || blockedCategoryWords.some((word) => name.includes(word));
  });
}

function hasRejectedProductTerm(product, searchTerm) {
  const rejectedTerms = rejectedProductTermsBySearchTerm.get(normalizeText(searchTerm));

  if (!rejectedTerms) {
    return false;
  }

  const normalizedName = normalizeText(product.name);
  return rejectedTerms.some((term) => normalizedName.includes(normalizeText(term)));
}

function buildProductCandidate(product, ingredient, searchTerm) {
  const quantity = calculateQuantity(ingredient, product);
  const store = getPrimaryStore(product);
  const relevanceScore = getRelevanceScore(product.name, searchTerm);

  return {
    relevanceScore,
    basketCost: quantity.basketCost,
    unitPrice: product.current_unit_price ?? Number.POSITIVE_INFINITY,
    productMatch: {
      productId: product.id,
      name: product.name,
      storeName: store.name,
      storeCode: store.code,
      price: roundCurrency(product.current_price),
      unitPrice: roundCurrency(product.current_unit_price),
      packageAmount: quantity.packageAmount,
      packageUnit: quantity.packageUnit,
      packagesNeeded: quantity.packagesNeeded,
      basketCost: quantity.basketCost,
      quantityEstimated: quantity.quantityEstimated,
      url: product.url
    }
  };
}

function calculateQuantity(ingredient, product) {
  const ingredientQuantity = normalizeQuantity(ingredient.amount, ingredient.unit);
  const productQuantity = normalizeQuantity(product.weight, product.weight_unit || inferUnitFromName(product.name));
  const canCompare = ingredientQuantity && productQuantity && ingredientQuantity.kind === productQuantity.kind;
  const packagesNeeded = canCompare
    ? Math.max(1, Math.ceil(ingredientQuantity.amount / productQuantity.amount))
    : 1;

  return {
    packageAmount: product.weight ?? null,
    packageUnit: product.weight_unit ?? null,
    packagesNeeded,
    basketCost: roundCurrency(packagesNeeded * product.current_price),
    quantityEstimated: !canCompare
  };
}

export function normalizeQuantity(amount, unit) {
  const numberAmount = Number(amount);
  const normalizedUnit = normalizeUnit(unit);

  if (!Number.isFinite(numberAmount) || numberAmount <= 0 || !normalizedUnit) {
    return null;
  }

  return {
    kind: normalizedUnit.kind,
    amount: numberAmount * normalizedUnit.factor
  };
}

function normalizeUnit(unit) {
  const value = String(unit || "").trim().toLowerCase();

  const units = {
    g: { kind: "mass", factor: 1 },
    gram: { kind: "mass", factor: 1 },
    hg: { kind: "mass", factor: 100 },
    kg: { kind: "mass", factor: 1000 },
    kilogram: { kind: "mass", factor: 1000 },
    ml: { kind: "volume", factor: 1 },
    cl: { kind: "volume", factor: 10 },
    dl: { kind: "volume", factor: 100 },
    l: { kind: "volume", factor: 1000 },
    liter: { kind: "volume", factor: 1000 },
    stk: { kind: "count", factor: 1 },
    stykk: { kind: "count", factor: 1 },
    piece: { kind: "count", factor: 1 },
    pcs: { kind: "count", factor: 1 }
  };

  return units[value] || null;
}

function getRelevanceScore(productName, searchTerm) {
  const productWords = normalizeText(productName).split(/[^a-z0-9æøå]+/).filter(Boolean);
  const terms = [searchTerm, ...(searchAliasesBySearchTerm.get(normalizeText(searchTerm)) || [])];
  const words = terms.flatMap((term) => normalizeText(term).split(/\s+/).filter(Boolean));

  if (!words.length) {
    return 0;
  }

  return words.reduce((score, word) => {
    if (productWords.some((productWord) => productWord === word)) {
      return score + 6;
    }

    if (productWords.some((productWord) => productWord.startsWith(word))) {
      return score + 4;
    }

    if (productWords.some((productWord) => productWord.endsWith(word))) {
      return score + 2;
    }

    return score;
  }, 0);
}

function compareCandidates(a, b) {
  return (
    Number(a.productMatch.quantityEstimated) - Number(b.productMatch.quantityEstimated) ||
    a.basketCost - b.basketCost ||
    a.unitPrice - b.unitPrice ||
    b.relevanceScore - a.relevanceScore
  );
}

function getPrimaryStore(product) {
  return Array.isArray(product.store) ? product.store[0] : product.store;
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/æ/g, "ae")
    .replace(/ø/g, "o")
    .replace(/å/g, "a");
}

function getCategoryIdHint(searchTerm) {
  return categoryHintsBySearchTerm.get(normalizeText(searchTerm));
}

function inferUnitFromName(name) {
  const normalized = normalizeText(name).replace(",", ".");
  const match = normalized.match(/\b\d+(?:\.\d+)?\s?(kg|g|l|ml|stk|pk)\b/);

  if (!match) {
    return null;
  }

  if (match[1] === "pk") {
    return "piece";
  }

  return match[1];
}

function roundCurrency(value) {
  if (!Number.isFinite(value)) {
    return null;
  }

  return Math.round(value * 100) / 100;
}

async function mapWithConcurrency(items, concurrency, mapper) {
  const results = new Array(items.length);
  let nextIndex = 0;

  async function worker() {
    while (nextIndex < items.length) {
      const index = nextIndex;
      nextIndex += 1;
      results[index] = await mapper(items[index], index);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, () => worker())
  );

  return results;
}
