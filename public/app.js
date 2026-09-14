const totalMeals = 7;
const mealTypes = [
  { key: "meat", label: "Meat" },
  { key: "chicken", label: "Chicken" },
  { key: "fish", label: "Fish" },
  { key: "vegetarian", label: "Vegetarian" }
];

const form = document.querySelector("#meal-form");
const selectedCount = document.querySelector("#selected-count");
const remainingCount = document.querySelector("#remaining-count");
const submitButton = document.querySelector("#submit-button");
const resultPanel = document.querySelector("#result-panel");
const resultList = document.querySelector("#result-list");
const selects = new Map(
  mealTypes.map((mealType) => [
    mealType.key,
    document.querySelector(`select[name="${mealType.key}"]`)
  ])
);

for (const select of selects.values()) {
  select.addEventListener("change", updatePlanner);
}

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const values = getValues();
  const selectedTotal = getSelectedTotal(values);

  if (selectedTotal !== totalMeals) {
    return;
  }

  renderResult(values);
});

updatePlanner();

function updatePlanner() {
  const values = getValues();
  const selectedTotal = getSelectedTotal(values);
  const remaining = totalMeals - selectedTotal;

  for (const [key, select] of selects) {
    const currentValue = values[key];
    const maxForSelect = currentValue + remaining;
    renderOptions(select, maxForSelect, currentValue);
  }

  selectedCount.textContent = selectedTotal;
  remainingCount.textContent = remaining;
  submitButton.disabled = selectedTotal !== totalMeals;

  if (selectedTotal !== totalMeals) {
    resultPanel.hidden = true;
  }
}

function getValues() {
  return Object.fromEntries(
    [...selects].map(([key, select]) => [key, Number(select.value || 0)])
  );
}

function getSelectedTotal(values) {
  return Object.values(values).reduce((sum, value) => sum + value, 0);
}

function renderOptions(select, max, selectedValue) {
  const options = [];

  for (let value = 0; value <= max; value += 1) {
    options.push(
      `<option value="${value}"${value === selectedValue ? " selected" : ""}>${value}</option>`
    );
  }

  select.innerHTML = options.join("");
}

function renderResult(values) {
  resultList.innerHTML = mealTypes
    .map((mealType) => {
      const count = values[mealType.key];
      const mealText = count === 1 ? "dinner" : "dinners";

      return `<li><span>${mealType.label}</span><strong>${count} ${mealText}</strong></li>`;
    })
    .join("");

  resultPanel.hidden = false;
}
