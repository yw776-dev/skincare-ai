import { headers } from "next/headers";
import Link from "next/link";
import ResultCard from "@/components/ResultCard";
import ProductCard from "@/components/ProductCard";
import type { ProductRecommendation } from "@/components/ProductCard";
import {
  INGREDIENT_LINKS,
  slugToQuery,
  slugToTitle,
} from "@/lib/ingredients";

type AnalysisResult =
  | {
      mode: "product";
      product_name: string;
      pros: string[];
      cons: string[];
      suitable_for: string[];
      who_should_use?: string;
      error?: string;
    }
  | {
      mode: "category";
      recommended_products: ProductRecommendation[];
      by_skin_type: Record<string, ProductRecommendation[]>;
      general_pros: string[];
      general_cons: string[];
    };

const SKIN_TYPES = ["dry", "oily", "combination", "sensitive", "acne prone"];

const RELATED_INGREDIENTS: Record<
  string,
  { sentence: string; links: { slug: string; label: string }[] }
> = {
  bha: {
    sentence:
      "BHA is often used alongside niacinamide or hyaluronic acid in skincare routines.",
    links: [
      { slug: "niacinamide", label: "niacinamide" },
      { slug: "hyaluronic-acid", label: "hyaluronic acid" },
    ],
  },
  "salicylic acid": {
    sentence:
      "Salicylic acid is often used alongside BHA, niacinamide, or hyaluronic acid.",
    links: [
      { slug: "bha", label: "BHA" },
      { slug: "niacinamide", label: "niacinamide" },
      { slug: "hyaluronic-acid", label: "hyaluronic acid" },
    ],
  },
  aha: {
    sentence:
      "AHAs are often used with BHA, niacinamide, or hyaluronic acid in routines.",
    links: [
      { slug: "bha", label: "BHA" },
      { slug: "niacinamide", label: "niacinamide" },
      { slug: "hyaluronic-acid", label: "hyaluronic acid" },
    ],
  },
  "glycolic acid": {
    sentence:
      "Glycolic acid is often paired with lactic acid or hyaluronic acid.",
    links: [
      { slug: "lactic-acid", label: "lactic acid" },
      { slug: "hyaluronic-acid", label: "hyaluronic acid" },
    ],
  },
  "lactic acid": {
    sentence:
      "Lactic acid is often used with glycolic acid or hyaluronic acid.",
    links: [
      { slug: "glycolic-acid", label: "glycolic acid" },
      { slug: "hyaluronic-acid", label: "hyaluronic acid" },
    ],
  },
  retinol: {
    sentence:
      "Retinol is often paired with vitamin C or niacinamide in skincare routines.",
    links: [
      { slug: "vitamin-c", label: "vitamin C" },
      { slug: "niacinamide", label: "niacinamide" },
    ],
  },
  "vitamin c": {
    sentence:
      "Vitamin C is often used with retinol, niacinamide, or hyaluronic acid.",
    links: [
      { slug: "retinol", label: "retinol" },
      { slug: "niacinamide", label: "niacinamide" },
      { slug: "hyaluronic-acid", label: "hyaluronic acid" },
    ],
  },
  niacinamide: {
    sentence:
      "Niacinamide pairs well with BHA, retinol, or hyaluronic acid in routines.",
    links: [
      { slug: "bha", label: "BHA" },
      { slug: "retinol", label: "retinol" },
      { slug: "hyaluronic-acid", label: "hyaluronic acid" },
    ],
  },
  "hyaluronic acid": {
    sentence:
      "Hyaluronic acid is often layered with niacinamide or ceramides.",
    links: [
      { slug: "niacinamide", label: "niacinamide" },
      { slug: "ceramides", label: "ceramides" },
    ],
  },
  ceramides: {
    sentence:
      "Ceramides are commonly used with hyaluronic acid or niacinamide.",
    links: [
      { slug: "hyaluronic-acid", label: "hyaluronic acid" },
      { slug: "niacinamide", label: "niacinamide" },
    ],
  },
  "azelaic acid": {
    sentence:
      "Azelaic acid is often used with niacinamide or vitamin C.",
    links: [
      { slug: "niacinamide", label: "niacinamide" },
      { slug: "vitamin-c", label: "vitamin C" },
    ],
  },
  bakuchiol: {
    sentence:
      "Bakuchiol is often used as a retinol alternative alongside niacinamide or vitamin C.",
    links: [
      { slug: "retinol", label: "retinol" },
      { slug: "niacinamide", label: "niacinamide" },
      { slug: "vitamin-c", label: "vitamin C" },
    ],
  },
};

function RelatedIngredients({
  currentSlug,
  currentTitle,
}: {
  currentSlug: string;
  currentTitle: string;
}) {
  const queryLower = currentTitle.toLowerCase();
  const related = RELATED_INGREDIENTS[queryLower];
  if (related) {
    return (
      <section className="pt-6 border-t border-stone-200">
        <h2 className="text-lg font-semibold text-stone-800 mb-2">
          Related ingredients
        </h2>
        <p className="text-sm text-stone-600 leading-relaxed mb-2">
          {related.sentence}{" "}
          {related.links.map((l, i) => (
            <span key={l.slug}>
              <Link
                href={`/ingredient/${l.slug}`}
                className="text-stone-800 font-medium underline hover:no-underline"
              >
                {l.label}
              </Link>
              {i < related.links.length - 1 ? ", " : ""}
            </span>
          ))}
          .
        </p>
      </section>
    );
  }
  const others = INGREDIENT_LINKS.filter((l) => l.slug !== currentSlug);
  return (
    <section className="pt-6 border-t border-stone-200">
      <h2 className="text-lg font-semibold text-stone-800 mb-2">
        Explore more ingredients
      </h2>
      <p className="text-sm text-stone-600 mb-2">
        Compare insights:{" "}
        {others.slice(0, 12).map((l, i) => (
          <span key={l.slug}>
            <Link
              href={`/ingredient/${l.slug}`}
              className="text-stone-800 font-medium underline hover:no-underline"
            >
              {l.label}
            </Link>
            {i < Math.min(others.length, 12) - 1 ? ", " : ""}
          </span>
        ))}
        .
      </p>
    </section>
  );
}

function getBaseUrl(): string {
  const h = headers();
  const host = h.get("x-forwarded-host") || h.get("host") || "localhost:3000";
  const proto = h.get("x-forwarded-proto") || (host.includes("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ingredient: string }>;
}) {
  const { ingredient: slug } = await params;
  const name = slugToTitle(slug);
  const metaTitle = `${name} Skincare Reviews & Pros/Cons | Real User Insights`;
  const description = `AI summary of real user skincare experiences discussing ${name}. Discover benefits, downsides, and recommended products based on thousands of skincare discussions.`;
  const keywords = [
    `${name} skincare`,
    `${name} review`,
    `${name} pros and cons`,
    `${name} benefits`,
    `${name} for acne`,
    "skincare ingredient reviews",
    "skincare community opinions",
    "skincare user feedback",
  ];
  return {
    title: metaTitle,
    description,
    keywords,
    openGraph: {
      title: `${metaTitle} | SkinSignal`,
      description,
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title: metaTitle,
      description,
    },
  };
}

async function fetchAnalysis(query: string): Promise<AnalysisResult | null> {
  const base = getBaseUrl();
  try {
    const discussionsRes = await fetch(
      `${base}/api/discussions?q=${encodeURIComponent(query)}`,
      { next: { revalidate: 3600 } }
    );
    if (!discussionsRes.ok) return null;
    const discussionsData = await discussionsRes.json();
    const text = discussionsData.text ?? discussionsData.combinedText ?? "";
    if (!text) return null;

    const analyzeRes = await fetch(`${base}/api/analyze`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, query }),
      cache: "no-store",
    });
    if (!analyzeRes.ok) return null;
    const data = await analyzeRes.json();
    if (data && typeof data === "object" && "mode" in data) {
      return data as AnalysisResult;
    }
    return null;
  } catch {
    return null;
  }
}

export async function generateStaticParams() {
  return INGREDIENT_LINKS.map(({ slug }) => ({ ingredient: slug }));
}

export default async function IngredientPage({
  params,
}: {
  params: Promise<{ ingredient: string }>;
}) {
  const { ingredient: slug } = await params;
  const query = slugToQuery(slug);
  const title = slugToTitle(slug);

  const result = await fetchAnalysis(query);

  const metaDescription = result
    ? `AI summary of real user skincare experiences discussing ${title}. Pros, cons, and recommended products.`
    : `Real user skincare insights and discussions about ${title}.`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `${title.toLowerCase()} skincare insights`,
    description: `AI summary of real user skincare experiences discussing ${title}`,
    author: {
      "@type": "Organization",
      name: "AI Skincare Insights",
    },
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="container max-w-3xl mx-auto px-4 py-12 space-y-6">
        <nav className="text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-700">
            SkinSignal
          </Link>
          <span className="mx-2">/</span>
          <Link href="/ingredient" className="hover:text-stone-700">
            Ingredients
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-700">{title}</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">
          What Users Say About {title} Skincare
        </h1>

        {!result && (
          <section className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
            We couldn&apos;t load discussion data for this ingredient right
            now. Try again later or{" "}
            <Link href="/" className="underline font-medium">
              search on the homepage
            </Link>
            .
          </section>
        )}

        {result?.mode === "product" && (
          <>
            {result.error && (
              <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
                {result.error}
              </div>
            )}
            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">
                Pros
              </h2>
              <ResultCard title=" " items={result.pros} variant="pros" />
            </section>
            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">
                Cons
              </h2>
              <ResultCard title=" " items={result.cons} variant="cons" />
            </section>
            {result.suitable_for?.length > 0 && (
              <section>
                <h2 className="text-xl font-semibold text-stone-800 mb-3">
                  Skin Types
                </h2>
                <p className="text-stone-600 text-sm mb-2">
                  Best for: {result.suitable_for.join(", ")}
                </p>
              </section>
            )}
            {result.who_should_use && (
              <p className="text-stone-600 text-sm italic">
                {result.who_should_use}
              </p>
            )}
          </>
        )}

        {result?.mode === "category" && (
          <>
            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">
                Pros
              </h2>
              <ResultCard
                title="What people like"
                items={result.general_pros}
                variant="pros"
              />
            </section>
            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">
                Cons
              </h2>
              <ResultCard
                title="Common complaints"
                items={result.general_cons}
                variant="cons"
              />
            </section>
            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">
                Recommended Products
              </h2>
              {result.recommended_products?.filter((p) => p.name?.trim())
                .length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                  {result.recommended_products
                    .filter((p) => p.name?.trim())
                    .map((product, i) => (
                      <ProductCard key={i} product={product} />
                    ))}
                </div>
              ) : (
                <p className="text-stone-500 text-sm">
                  No products found for this category.
                </p>
              )}
            </section>
            <section>
              <h2 className="text-xl font-semibold text-stone-800 mb-3">
                Skin Types
              </h2>
              <div className="space-y-6">
                {SKIN_TYPES.map((skinType) => {
                  const products =
                    result.by_skin_type?.[skinType]?.filter(
                      (p) =>
                        p.name &&
                        (p.pros?.length > 0 || p.cons?.length > 0)
                    ) ?? [];
                  if (products.length === 0) return null;
                  return (
                    <div key={skinType}>
                      <h3 className="text-lg font-medium text-stone-700 mb-2 capitalize">
                        For {skinType} skin
                      </h3>
                      <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                        {products.slice(0, 6).map((product, i) => (
                          <ProductCard key={i} product={product} />
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </>
        )}

        <section className="pt-6 border-t border-stone-200 space-y-3">
          <p className="text-sm text-stone-600 leading-relaxed">
            This page summarizes real user skincare experiences discussing{" "}
            {title}. Our AI analyzes thousands of skincare discussions across
            beauty communities to highlight common benefits, concerns, and
            recommended products.
          </p>
        </section>

        <RelatedIngredients currentSlug={slug} currentTitle={title} />

        <p className="text-sm text-stone-500 pt-6">
          <Link href="/ingredient" className="hover:text-stone-700 underline">
            View all ingredients
          </Link>
          {" · "}
          <Link href="/" className="hover:text-stone-700 underline">
            Search more
          </Link>
        </p>
      </main>
    </div>
  );
}
