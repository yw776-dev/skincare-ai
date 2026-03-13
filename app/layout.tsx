import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Skincare Insights | Real User Reviews & Pros/Cons",
  description:
    "Search skincare ingredients or products to see AI-powered summaries of real user skincare experiences, including pros, cons, and recommended products.",
  keywords: [
    "skincare reviews",
    "skincare pros and cons",
    "skincare ingredient guide",
    "skincare product reviews",
    "skincare community insights",
    "best skincare ingredients",
    "skincare recommendations",
    "AI skincare analysis",
  ],
  openGraph: {
    title: "AI Skincare Insights",
    description:
      "Discover skincare insights from real user experiences across beauty communities.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "AI Skincare Insights",
    description:
      "Discover skincare insights from real user experiences.",
  },
};

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-stone-50 text-stone-900 flex flex-col">
        <div className="flex-1">{children}</div>
        <footer className="border-t border-stone-200 bg-stone-100/50 py-6 px-4">
          <p className="text-center text-sm text-stone-500 max-w-2xl mx-auto">
            This website uses AI to analyze real skincare discussions from
            online beauty communities and summarize the most common pros,
            cons, and product recommendations.
          </p>
        </footer>
        {GA_MEASUREMENT_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="ga4" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
      </body>
    </html>
  );
}
