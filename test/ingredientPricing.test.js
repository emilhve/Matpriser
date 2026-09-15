import test from "node:test";
import assert from "node:assert/strict";
import {
  normalizeQuantity,
  selectBestProductForIngredient
} from "../src/services/ingredientPricing.js";

test("normalizes comparable units", () => {
  assert.deepEqual(normalizeQuantity(1, "kg"), { kind: "mass", amount: 1000 });
  assert.deepEqual(normalizeQuantity(2, "dl"), { kind: "volume", amount: 200 });
  assert.deepEqual(normalizeQuantity(3, "stk"), { kind: "count", amount: 3 });
});

test("chooses lowest basket cost for rice", () => {
  const match = selectBestProductForIngredient(
    [
      product({ id: 1, name: "Ris 1kg", price: 45, weight: 1, unit: "kg" }),
      product({ id: 2, name: "Middagsris 500g", price: 24, weight: 500, unit: "g" })
    ],
    { name: "ris", searchTerm: "ris", amount: 300, unit: "g" }
  );

  assert.equal(match.productId, 2);
  assert.equal(match.packagesNeeded, 1);
  assert.equal(match.basketCost, 24);
});

test("calculates multiple packages when recipe needs more than package amount", () => {
  const match = selectBestProductForIngredient(
    [
      product({ id: 1, name: "Kyllingfilet 400g", price: 59, weight: 400, unit: "g" }),
      product({ id: 2, name: "Kyllingfilet 1kg", price: 149, weight: 1, unit: "kg" })
    ],
    { name: "kyllingfilet", searchTerm: "kyllingfilet", amount: 600, unit: "g" }
  );

  assert.equal(match.productId, 1);
  assert.equal(match.packagesNeeded, 2);
  assert.equal(match.basketCost, 118);
});

test("marks quantity as estimated when units cannot be compared", () => {
  const match = selectBestProductForIngredient(
    [product({ id: 1, name: "Egg 12pk", price: 39, weight: 12, unit: "piece" })],
    { name: "egg", searchTerm: "egg", amount: 2, unit: "unknown" }
  );

  assert.equal(match.packagesNeeded, 1);
  assert.equal(match.quantityEstimated, true);
});

test("filters dessert category products", () => {
  const match = selectBestProductForIngredient(
    [
      product({
        id: 1,
        name: "Sjokoladeis",
        price: 10,
        weight: 1,
        unit: "piece",
        category: [{ id: 404, name: "Dessertis" }]
      }),
      product({ id: 2, name: "Ris 500g", price: 25, weight: 500, unit: "g" })
    ],
    { name: "ris", searchTerm: "ris", amount: 300, unit: "g" }
  );

  assert.equal(match.productId, 2);
});

test("returns null if no confident match exists", () => {
  const match = selectBestProductForIngredient(
    [product({ id: 1, name: "Pasta 500g", price: 20, weight: 500, unit: "g" })],
    { name: "ris", searchTerm: "ris", amount: 300, unit: "g" }
  );

  assert.equal(match, null);
});

test("does not match rice inside unrelated words", () => {
  const match = selectBestProductForIngredient(
    [product({ id: 1, name: "Meierismør Kuvert 12g Tine", price: 10, weight: 12, unit: "g" })],
    { name: "ris", searchTerm: "ris", amount: 300, unit: "g" }
  );

  assert.equal(match, null);
});

test("filters ready meals when matching simple ingredients", () => {
  const match = selectBestProductForIngredient(
    [
      product({
        id: 1,
        name: "Kjøttboller M Potetmos 540g",
        price: 20,
        weight: 540,
        unit: "g",
        category: [{ id: 269, name: "Ferdigmåltid" }]
      }),
      product({
        id: 2,
        name: "Potetmos 300g",
        price: 39,
        weight: 300,
        unit: "g",
        category: [{ id: 158, name: "Potetmos" }]
      })
    ],
    { name: "potetmos", searchTerm: "potetmos", amount: 300, unit: "g" }
  );

  assert.equal(match.productId, 2);
});

test("does not block fish cakes as dessert cakes", () => {
  const match = selectBestProductForIngredient(
    [
      product({
        id: 1,
        name: "Fiskekaker 700g First Price",
        price: 42,
        weight: 700,
        unit: "g",
        category: [{ id: 270, name: "Fiskekaker" }]
      })
    ],
    { name: "fiskekaker", searchTerm: "fiskekaker", amount: 300, unit: "g" }
  );

  assert.equal(match.productId, 1);
});

test("rejects composed products for broad dairy ingredients", () => {
  const match = selectBestProductForIngredient(
    [
      product({
        id: 1,
        name: "Wienerpølse u/Melk pr Kg",
        price: 2,
        weight: 1000,
        unit: "g",
        category: [{ id: 63, name: "Pølser" }]
      }),
      product({
        id: 2,
        name: "Lettmelk 0,5% 1l Tine",
        price: 21,
        weight: 1,
        unit: "l",
        category: [{ id: 179, name: "Lettmelk" }]
      })
    ],
    { name: "melk", searchTerm: "melk", amount: 200, unit: "ml" }
  );

  assert.equal(match.productId, 2);
});

test("does not match rømme inside unrelated words", () => {
  const match = selectBestProductForIngredient(
    [product({ id: 1, name: "Det Innerste Rommet", price: 10, weight: 300, unit: "g" })],
    { name: "rømme", searchTerm: "rømme", amount: 200, unit: "g" }
  );

  assert.equal(match, null);
});

test("prefers vegetable stock when matching grønnsaksbuljong", () => {
  const match = selectBestProductForIngredient(
    [
      product({ id: 1, name: "Kyllingbuljong 80g", price: 10, weight: 80, unit: "g" }),
      product({ id: 2, name: "Grønnsaksbuljong Klar 80g Maggi", price: 20, weight: 80, unit: "g" })
    ],
    { name: "grønnsaksbuljong", searchTerm: "grønnsaksbuljong", amount: 20, unit: "g" }
  );

  assert.equal(match.productId, 2);
});

test("rejects vegan sausage when matching regular pølser", () => {
  const match = selectBestProductForIngredient(
    [
      product({ id: 1, name: "Pølser vegansk 300g", price: 20, weight: 300, unit: "g" }),
      product({ id: 2, name: "Grillpølser 600g", price: 39, weight: 600, unit: "g" })
    ],
    { name: "pølser", searchTerm: "pølser", amount: 300, unit: "g" }
  );

  assert.equal(match.productId, 2);
});

test("matches flatbrød as a basic ingredient", () => {
  const match = selectBestProductForIngredient(
    [product({ id: 1, name: "Flatbrød Mors Hjemmebakte 520g", price: 54, weight: 520, unit: "g" })],
    { name: "flatbrød", searchTerm: "flatbrød", amount: 100, unit: "g" }
  );

  assert.equal(match.productId, 1);
});

test("rejects chicken blend when matching meat mince", () => {
  const match = selectBestProductForIngredient(
    [
      product({
        id: 1,
        name: "Kjøttdeig Kylling&Storfe 400g",
        price: 39,
        weight: 400,
        unit: "g",
        category: [{ id: 169, name: "Kjøttdeig" }]
      }),
      product({
        id: 2,
        name: "Kjøttdeig 400g First Price",
        price: 49,
        weight: 400,
        unit: "g",
        category: [{ id: 169, name: "Kjøttdeig" }]
      })
    ],
    { name: "kjøttdeig", searchTerm: "kjøttdeig", amount: 400, unit: "g" }
  );

  assert.equal(match.productId, 2);
});

function product({ id, name, price, weight, unit, category = [{ id: 606, name: "Ris" }] }) {
  return {
    id,
    name,
    current_price: price,
    current_unit_price: price,
    weight,
    weight_unit: unit,
    url: `https://example.com/products/${id}`,
    store: [{ name: "KIWI", code: "KIWI", url: "https://kiwi.no", logo: "" }],
    category
  };
}
