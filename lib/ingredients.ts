/**
 * Canonical list of ingredient slugs for SEO pages.
 * Used by: ingredient index, sitemap, generateStaticParams, related links.
 */

export const INGREDIENT_SLUGS = [
  "bha",
  "salicylic-acid",
  "aha",
  "glycolic-acid",
  "lactic-acid",
  "mandelic-acid",
  "pha",
  "retinol",
  "retinoid",
  "bakuchiol",
  "peptides",
  "collagen",
  "hyaluronic-acid",
  "ceramides",
  "glycerin",
  "squalane",
  "panthenol",
  "vitamin-c",
  "niacinamide",
  "alpha-arbutin",
  "kojic-acid",
  "tranexamic-acid",
  "benzoyl-peroxide",
  "azelaic-acid",
  "tea-tree",
  "centella",
  "cica",
  "snail-mucin",
] as const;

export type IngredientSlug = (typeof INGREDIENT_SLUGS)[number];

export function slugToQuery(slug: string): string {
  return slug.replace(/-/g, " ").trim();
}

export function slugToTitle(slug: string): string {
  return slugToQuery(slug).replace(/\b\w/g, (c) => c.toUpperCase());
}

export const INGREDIENT_LINKS = INGREDIENT_SLUGS.map((slug) => ({
  slug,
  label: slugToTitle(slug),
}));
