import { INGREDIENT_SLUGS } from "@/lib/ingredients";

const BASE = "https://skinsignal.com";

export default function sitemap() {
  const ingredientEntries = INGREDIENT_SLUGS.map((slug) => ({
    url: `${BASE}/ingredient/${slug}`,
    lastModified: new Date(),
  }));

  return [
    { url: BASE, lastModified: new Date() },
    { url: `${BASE}/ingredient`, lastModified: new Date() },
    ...ingredientEntries,
  ];
}
