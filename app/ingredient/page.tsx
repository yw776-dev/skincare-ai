import Link from "next/link";
import { INGREDIENT_LINKS } from "@/lib/ingredients";

export const metadata = {
  title: "Skincare Ingredient Reviews | Real User Insights | SkinSignal",
  description:
    "AI summaries of real user skincare experiences for popular ingredients. Pros, cons, and product recommendations from online beauty communities.",
  openGraph: {
    title: "Skincare Ingredient Reviews | Real User Insights | SkinSignal",
    description:
      "AI-powered summaries of real user skincare experiences. Pros, cons, and recommended products from online beauty communities.",
    type: "website",
  },
};

export default function IngredientIndexPage() {
  return (
    <div className="min-h-screen bg-stone-50 text-stone-900">
      <main className="container max-w-3xl mx-auto px-4 py-12 space-y-6">
        <nav className="text-sm text-stone-500">
          <Link href="/" className="hover:text-stone-700">
            SkinSignal
          </Link>
          <span className="mx-2">/</span>
          <span className="text-stone-700">Ingredients</span>
        </nav>

        <h1 className="text-3xl sm:text-4xl font-bold text-stone-900">
          Skincare Ingredient Reviews from Real User Experiences
        </h1>
        <p className="text-lg text-stone-600">
          AI summaries of real user skincare experiences from online beauty
          communities. Click an ingredient for pros, cons, and product
          recommendations.
        </p>

        <section>
          <h2 className="sr-only">Popular ingredients</h2>
          <ul className="space-y-3">
            {INGREDIENT_LINKS.map(({ slug, label }) => (
              <li key={slug}>
                <Link
                  href={`/ingredient/${slug}`}
                  className="block rounded-lg border border-stone-200 bg-white px-4 py-3 text-stone-800 font-medium hover:bg-stone-50 hover:border-stone-300 transition-colors"
                >
                  {label} skincare reviews →
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <p className="text-sm text-stone-500 pt-4">
          <Link href="/" className="hover:text-stone-700 underline">
            Search any product or ingredient on the homepage
          </Link>
        </p>
      </main>
    </div>
  );
}
