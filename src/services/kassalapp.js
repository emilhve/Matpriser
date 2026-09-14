import { requestApi } from "../lib/apiClient.js";

export function healthCheck() {
  return requestApi("health");
}

export function listLabels(query = {}) {
  return requestApi("labels", { query });
}

export function searchPhysicalStores(query = {}) {
  return requestApi("physical-stores", { query });
}

export function findPhysicalStoreById(physicalStore) {
  return requestApi(`physical-stores/${encodePathPart(physicalStore)}`);
}

export function searchProducts(query = {}) {
  return requestApi("products", { query });
}

export function findProductById(product) {
  return requestApi(`products/id/${encodePathPart(product)}`);
}

export function findProductByEanBarcode(ean) {
  return requestApi(`products/ean/${encodePathPart(ean)}`);
}

export function findProductByUrl(url) {
  return requestApi("products/find-by-url/single", {
    query: { url }
  });
}

export function findProductsByUrl(url) {
  return requestApi("products/find-by-url/compare", {
    query: { url }
  });
}

export function bulkPriceHistory({ eans, days, aggregation }) {
  return requestApi("products/prices-bulk", {
    method: "POST",
    body: { eans, days, aggregation }
  });
}

export function searchProductCategories(query = {}) {
  return requestApi("categories", { query });
}

export function findCategoryById(category) {
  return requestApi(`categories/${encodePathPart(category)}`);
}

export function listShoppingLists(query = {}) {
  return requestApi("shopping-lists", { query });
}

export function createShoppingList(body) {
  return requestApi("shopping-lists", {
    method: "POST",
    body
  });
}

export function showShoppingList(shoppingList) {
  return requestApi(`shopping-lists/${encodePathPart(shoppingList)}`);
}

export function updateShoppingList(shoppingList, body) {
  return requestApi(`shopping-lists/${encodePathPart(shoppingList)}`, {
    method: "PATCH",
    body
  });
}

export function deleteShoppingList(shoppingList) {
  return requestApi(`shopping-lists/${encodePathPart(shoppingList)}`, {
    method: "DELETE"
  });
}

export function createShoppingListItem(shoppingList, body) {
  return requestApi(`shopping-lists/${encodePathPart(shoppingList)}/items`, {
    method: "POST",
    body
  });
}

export function updateShoppingListItem(shoppingList, shoppingListItem, body) {
  return requestApi(
    `shopping-lists/${encodePathPart(shoppingList)}/items/${encodePathPart(shoppingListItem)}`,
    {
      method: "PATCH",
      body
    }
  );
}

export function deleteShoppingListItem(shoppingList, shoppingListItem) {
  return requestApi(
    `shopping-lists/${encodePathPart(shoppingList)}/items/${encodePathPart(shoppingListItem)}`,
    {
      method: "DELETE"
    }
  );
}

export function listWebhooks(query = {}) {
  return requestApi("webhooks", { query });
}

export function createWebhook(body) {
  return requestApi("webhooks", {
    method: "POST",
    body
  });
}

export function updateWebhook(webhook, body) {
  return requestApi(`webhooks/${encodePathPart(webhook)}`, {
    method: "PATCH",
    body
  });
}

export function deleteWebhook(webhook) {
  return requestApi(`webhooks/${encodePathPart(webhook)}`, {
    method: "DELETE"
  });
}

function encodePathPart(value) {
  if (value === undefined || value === null || value === "") {
    throw new Error("Path parameter cannot be empty");
  }

  return encodeURIComponent(value);
}
