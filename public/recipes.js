const mealLabels = {
  meat: "Meat",
  chicken: "Chicken",
  fish: "Fish",
  vegetarian: "Vegetarian"
};

const ticketGrid = document.querySelector("#ticket-grid");
const mealPlan = readMealPlan();

if (!mealPlan?.recipes?.length) {
  renderEmptyState();
} else {
  renderTickets(mealPlan.recipes);
}

function readMealPlan() {
  try {
    return JSON.parse(sessionStorage.getItem("mealPlan"));
  } catch {
    return null;
  }
}

function renderTickets(recipes) {
  const fragment = document.createDocumentFragment();

  recipes.slice(0, 7).forEach((recipe, index) => {
    const ticket = document.createElement("article");
    ticket.className = `order-ticket ${recipe.type}`;

    const meta = document.createElement("div");
    meta.className = "ticket-meta";

    const number = document.createElement("span");
    number.textContent = `Order #${String(index + 1).padStart(2, "0")}`;

    const type = document.createElement("span");
    type.textContent = mealLabels[recipe.type] || recipe.type;

    meta.append(number, type);

    const title = document.createElement("h2");
    title.textContent = recipe.title;

    const list = document.createElement("ul");
    list.className = "ticket-ingredients";

    for (const ingredient of recipe.ingredients || []) {
      const item = document.createElement("li");
      const ingredientName = document.createElement("span");
      ingredientName.className = "ingredient-name";
      ingredientName.textContent = formatIngredient(ingredient);
      item.append(ingredientName);

      if (ingredient.productMatch) {
        item.append(renderProductMatch(ingredient.productMatch));
      } else {
        const noMatch = document.createElement("span");
        noMatch.className = "ingredient-match missing";
        noMatch.textContent = "No price match found";
        item.append(noMatch);
      }

      list.append(item);
    }

    const total = document.createElement("p");
    total.className = "ticket-total";
    total.textContent = `Meal total: ${formatCurrency(recipe.basketTotal)}`;

    ticket.append(meta, title, list, total);
    fragment.append(ticket);
  });

  ticketGrid.replaceChildren(fragment);
}

function renderEmptyState() {
  const message = document.createElement("article");
  message.className = "empty-ticket";
  message.textContent = "No recipes found.";
  ticketGrid.replaceChildren(message);
}

function formatIngredient(ingredient) {
  const amount = ingredient.amount ?? "";
  const unit = ingredient.unit ?? "";
  const name = ingredient.name ?? "";

  return `${amount} ${unit} ${name}`.trim();
}

function renderProductMatch(productMatch) {
  const wrapper = document.createElement("span");
  wrapper.className = "ingredient-match";

  const product = document.createElement("span");
  product.className = "matched-product";
  product.textContent = productMatch.name;

  const store = document.createElement("span");
  store.textContent = `${productMatch.storeName} · ${formatCurrency(productMatch.basketCost)}`;

  wrapper.append(product, store);

  if (productMatch.quantityEstimated) {
    const warning = document.createElement("span");
    warning.className = "quantity-warning";
    warning.textContent = "quantity estimated";
    wrapper.append(warning);
  }

  return wrapper;
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
