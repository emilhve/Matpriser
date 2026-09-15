const storeList = document.querySelector("#store-list");
const shoppingSummary = document.querySelector("#shopping-summary");
const unmatchedPanel = document.querySelector("#unmatched-panel");
const unmatchedList = document.querySelector("#unmatched-list");
const mealPlan = readMealPlan();

if (!mealPlan?.recipes?.length) {
  renderEmptyState();
} else {
  const shoppingList = buildShoppingList(mealPlan.recipes);
  renderSummary(shoppingList);
  renderStores(shoppingList.stores);
  renderUnmatched(shoppingList.unmatched);
}

function readMealPlan() {
  try {
    return JSON.parse(sessionStorage.getItem("mealPlan"));
  } catch {
    return null;
  }
}

function buildShoppingList(recipes) {
  const stores = new Map();
  const unmatched = [];

  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients || []) {
      const match = ingredient.productMatch;

      if (!match) {
        unmatched.push({
          recipeTitle: recipe.title,
          ingredient: formatIngredient(ingredient)
        });
        continue;
      }

      const storeKey = match.storeCode || match.storeName || "unknown-store";
      const store = getOrCreateStore(stores, storeKey, match);
      const itemKey = String(match.productId || `${storeKey}:${match.name}:${match.price}`);
      const item = getOrCreateItem(store.items, itemKey, match);
      const packagesNeeded = Number(match.packagesNeeded) || 1;
      const basketCost = Number(match.basketCost) || packagesNeeded * (Number(match.price) || 0);

      item.packagesNeeded += packagesNeeded;
      item.basketCost += basketCost;
      item.quantityEstimated = item.quantityEstimated || Boolean(match.quantityEstimated);
      item.usedFor.push({
        recipeTitle: recipe.title,
        ingredient: formatIngredient(ingredient)
      });
      store.total += basketCost;
    }
  }

  const storeGroups = [...stores.values()]
    .map((store) => ({
      ...store,
      total: roundCurrency(store.total),
      items: [...store.items.values()]
        .map((item) => ({
          ...item,
          basketCost: roundCurrency(item.basketCost)
        }))
        .sort((a, b) => a.name.localeCompare(b.name, "nb"))
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "nb"));

  return {
    stores: storeGroups,
    unmatched,
    total: roundCurrency(storeGroups.reduce((sum, store) => sum + store.total, 0))
  };
}

function getOrCreateStore(stores, storeKey, match) {
  if (!stores.has(storeKey)) {
    stores.set(storeKey, {
      name: match.storeName || "Unknown store",
      code: match.storeCode || storeKey,
      items: new Map(),
      total: 0
    });
  }

  return stores.get(storeKey);
}

function getOrCreateItem(items, itemKey, match) {
  if (!items.has(itemKey)) {
    items.set(itemKey, {
      productId: match.productId,
      name: match.name,
      price: Number(match.price) || 0,
      packageAmount: match.packageAmount,
      packageUnit: match.packageUnit,
      packagesNeeded: 0,
      basketCost: 0,
      quantityEstimated: Boolean(match.quantityEstimated),
      usedFor: []
    });
  }

  return items.get(itemKey);
}

function renderSummary(shoppingList) {
  const storeCount = shoppingList.stores.length;
  const itemCount = shoppingList.stores.reduce((sum, store) => sum + store.items.length, 0);

  shoppingSummary.replaceChildren(
    renderSummaryItem("Stores", storeCount),
    renderSummaryItem("Products", itemCount),
    renderSummaryItem("Estimated total", formatCurrency(shoppingList.total))
  );
}

function renderSummaryItem(label, value) {
  const item = document.createElement("div");
  const title = document.createElement("span");
  const amount = document.createElement("strong");

  title.className = "summary-label";
  title.textContent = label;
  amount.textContent = value;
  item.append(title, amount);

  return item;
}

function renderStores(stores) {
  if (!stores.length) {
    renderEmptyState();
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const store of stores) {
    const section = document.createElement("article");
    section.className = "store-card";

    const header = document.createElement("header");
    header.className = "store-card-header";

    const title = document.createElement("h2");
    title.textContent = store.name;

    const total = document.createElement("strong");
    total.textContent = formatCurrency(store.total);

    header.append(title, total);

    const list = document.createElement("ul");
    list.className = "shopping-items";

    for (const item of store.items) {
      list.append(renderShoppingItem(item));
    }

    section.append(header, list);
    fragment.append(section);
  }

  storeList.replaceChildren(fragment);
}

function renderShoppingItem(item) {
  const listItem = document.createElement("li");

  const main = document.createElement("div");
  main.className = "shopping-item-main";

  const name = document.createElement("span");
  name.className = "shopping-item-name";
  name.textContent = item.name;

  const meta = document.createElement("span");
  meta.className = "shopping-item-meta";
  meta.textContent = `${item.packagesNeeded} x ${formatCurrency(item.price)} = ${formatCurrency(item.basketCost)}`;

  main.append(name, meta);

  const uses = document.createElement("ul");
  uses.className = "shopping-item-uses";

  for (const use of item.usedFor) {
    const useItem = document.createElement("li");
    useItem.textContent = `${use.ingredient} - ${use.recipeTitle}`;
    uses.append(useItem);
  }

  listItem.append(main, uses);

  if (item.quantityEstimated) {
    const warning = document.createElement("span");
    warning.className = "quantity-warning";
    warning.textContent = "quantity estimated";
    listItem.append(warning);
  }

  return listItem;
}

function renderUnmatched(unmatched) {
  if (!unmatched.length) {
    unmatchedPanel.hidden = true;
    unmatchedList.replaceChildren();
    return;
  }

  const fragment = document.createDocumentFragment();

  for (const item of unmatched) {
    const listItem = document.createElement("li");
    listItem.textContent = `${item.ingredient} - ${item.recipeTitle}`;
    fragment.append(listItem);
  }

  unmatchedList.replaceChildren(fragment);
  unmatchedPanel.hidden = false;
}

function renderEmptyState() {
  const message = document.createElement("article");
  message.className = "empty-ticket";
  message.textContent = "No shopping list found.";
  storeList.replaceChildren(message);
  shoppingSummary.replaceChildren();
  unmatchedPanel.hidden = true;
}

function formatIngredient(ingredient) {
  const amount = ingredient.amount ?? "";
  const unit = ingredient.unit ?? "";
  const name = ingredient.name ?? "";

  return `${amount} ${unit} ${name}`.trim();
}

function formatCurrency(value) {
  if (!Number.isFinite(value)) {
    return "No price";
  }

  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 2
  }).format(value);
}

function roundCurrency(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.round(value * 100) / 100;
}
