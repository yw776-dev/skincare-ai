"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import SearchBar from "@/components/SearchBar";
import ResultCard from "@/components/ResultCard";
import ProductCard from "@/components/ProductCard";

const FRIENDLY_ERROR = "AI analysis temporarily unavailable. Please try again later.";

export type ProductRecommendation = {
  name: string;
  skin_type: string[];
  pros: string[];
  cons: string[];
};

export type AnalysisResult =
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

export default function Home() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const FALLBACK_TRENDING = [
    "bha",
    "retinol",
    "vitamin c",
    "niacinamide",
    "moisturizer for dry skin",
  ];
  const [trendingQueries, setTrendingQueries] = useState<string[]>(FALLBACK_TRENDING);

  useEffect(() => {
    fetch("/api/search-queries")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data.queries) && data.queries.length > 0) {
          setTrendingQueries(data.queries);
        }
      })
      .catch(() => {});
  }, []);

  async function handleAnalyze(overrideQuery?: string) {
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setIsLoading(true);
    setError(null);
    setResult(null);
    if (overrideQuery !== undefined) setQuery(overrideQuery);

    try {
      const discussionsRes = await fetch(
        `/api/discussions?q=${encodeURIComponent(q)}`
      );
      if (!discussionsRes.ok) {
        setError(FRIENDLY_ERROR);
        setIsLoading(false);
        return;
      }
      const discussionsData = await discussionsRes.json();
      const text = discussionsData.text ?? discussionsData.combinedText ?? "";
      if (discussionsData.error && !text) {
        setError(FRIENDLY_ERROR);
        setIsLoading(false);
        return;
      }

      const analyzeRes = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, query: q }),
      });
      const analysisData = await analyzeRes.json();
      if (!analyzeRes.ok) {
        const msg = analysisData?.error === "Too many requests. Please wait."
          ? "Too many requests. Please wait."
          : FRIENDLY_ERROR;
        setError(msg);
        setIsLoading(false);
        return;
      }
      if (analysisData && typeof analysisData === "object" && !("mode" in analysisData)) {
        setError(FRIENDLY_ERROR);
        setIsLoading(false);
        return;
      }
      setResult(analysisData as AnalysisResult);
    } catch {
      setError(FRIENDLY_ERROR);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 sm:py-16">
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        <header className="text-center space-y-3">
          <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">
            AI Skincare Insights from Real User Experiences
          </h1>
          <p className="text-lg text-stone-600">
            Search any skincare ingredient or product and instantly see pros,
            cons, and recommendations based on thousands of real user skincare
            discussions.
          </p>
          <p className="text-sm text-stone-500 max-w-xl">
            AI-powered summaries of real skincare discussions from online
            beauty communities.
          </p>
        </header>

        <SearchBar
          value={query}
          onChange={setQuery}
          onAnalyze={() => handleAnalyze()}
          isLoading={isLoading}
        />

        <section className="w-full max-w-2xl">
          <p className="text-sm font-medium text-stone-500 mb-2">
            Trending searches
          </p>
          <div className="flex flex-wrap gap-2">
            {trendingQueries.map((term) => (
              <button
                key={term}
                type="button"
                onClick={() => handleAnalyze(term)}
                disabled={isLoading}
                className="px-4 py-2 rounded-full text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-50 transition-colors"
              >
                {term}
              </button>
            ))}
          </div>
        </section>

        <section className="w-full max-w-2xl">
          <p className="text-sm font-medium text-stone-500 mb-2">
            Trending Ingredients
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/ingredient/bha"
              className="px-4 py-2 rounded-full text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            >
              BHA
            </Link>
            <Link
              href="/ingredient/retinol"
              className="px-4 py-2 rounded-full text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            >
              Retinol
            </Link>
            <Link
              href="/ingredient/vitamin-c"
              className="px-4 py-2 rounded-full text-sm font-medium bg-stone-100 text-stone-700 hover:bg-stone-200 transition-colors"
            >
              Vitamin C
            </Link>
          </div>
        </section>

        {error && (
          <div className="w-full max-w-2xl rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-red-700 text-sm">
            {error}
          </div>
        )}

        {result && (
          <section className="w-full space-y-8">
            <h2 className="text-xl font-semibold text-stone-800">
              Results for &quot;{query}&quot;
            </h2>

            {result.mode === "product" && (
              <div className="space-y-6">
                {result.error && (
                  <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-amber-800 text-sm">
                    {FRIENDLY_ERROR}
                  </div>
                )}
                <div className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm">
                  <h3 className="text-xl font-semibold text-stone-900 mb-4">
                    {result.product_name}
                  </h3>
                  {result.who_should_use && (
                    <p className="text-stone-600 text-sm mb-4 italic">
                      {result.who_should_use}
                    </p>
                  )}
                  {result.suitable_for.length > 0 && (
                    <div className="mb-4">
                      <p className="text-sm font-medium text-stone-700 mb-2">
                        Best for
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {result.suitable_for.map((st) => (
                          <span
                            key={st}
                            className="inline-block px-3 py-1 rounded-full text-sm bg-stone-100 text-stone-700"
                          >
                            {st}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid gap-6 sm:grid-cols-2">
                    <ResultCard
                      title="Pros"
                      items={result.pros}
                      variant="pros"
                    />
                    <ResultCard
                      title="Cons"
                      items={result.cons}
                      variant="cons"
                    />
                  </div>
                </div>
              </div>
            )}

            {result.mode === "category" && (
              <>
                {result.recommended_products.length > 0 ? (
                  <div>
                    <h3 className="text-lg font-semibold text-stone-800 mb-4">
                      Recommended products
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                      {result.recommended_products
                        .filter((p) => p.name?.trim())
                        .map((product, i) => (
                          <ProductCard key={i} product={product} />
                        ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-lg bg-stone-100 border border-stone-200 px-4 py-3 text-stone-600 text-sm">
                    No products found for this category. Try a different search or check back later.
                  </div>
                )}
                {["dry", "oily", "combination", "sensitive", "acne prone"].map(
                  (skinType) => {
                    const products =
                      result.by_skin_type[skinType]?.filter(
                        (p) => p.name && (p.pros.length > 0 || p.cons.length > 0)
                      ) ?? [];
                    if (products.length === 0) return null;
                    return (
                      <div key={skinType}>
                        <h3 className="text-lg font-semibold text-stone-800 mb-4 capitalize">
                          For {skinType} skin
                        </h3>
                        <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                          {products.slice(0, 10).map((product, i) => (
                            <ProductCard key={i} product={product} />
                          ))}
                        </div>
                      </div>
                    );
                  }
                )}
                <div className="grid gap-6 sm:grid-cols-2">
                  <ResultCard
                    title="What People Like (general)"
                    items={result.general_pros}
                    variant="pros"
                  />
                  <ResultCard
                    title="Common Complaints (general)"
                    items={result.general_cons}
                    variant="cons"
                  />
                </div>
              </>
            )}
          </section>
        )}
      </div>
    </main>
  );
}
