import { healthCheck, searchProducts } from "./services/kassalapp.js";

async function main() {
  const search = process.argv.slice(2).join(" ");
  const result = search
    ? await searchProducts({ search, size: 5 })
    : await healthCheck();

  console.log(result);
}

main().catch((error) => {
  console.error(error.message);

  if (error.body) {
    console.error(error.body);
  }

  process.exitCode = 1;
});
