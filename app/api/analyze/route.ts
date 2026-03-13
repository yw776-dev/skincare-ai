import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";

const CATEGORY_KEYWORDS = [
  "moisturizer",
  "moisturiser",
  "moisturizing",
  "moisture cream",
  "moisturizing cream",
  "night cream",
  "day cream",
  "serum",
  "retinol",
  "cleanser",
  "oil cleanser",
  "cream cleanser",
  "gel cleanser",
  "sunscreen",
  "spf",
  "toner",
  "lotion",
  "body lotion",
  "oil",
  "face oil",
  "mask",
  "face mask",
  "sheet mask",
  "clay mask",
  "gel moisturizer",
  "gel cream",
  "vitamin c",
  "vitamin e",
  "vitamin a",
  "vitamin b3",
  "bha",
  "aha",
  "pha",
  "lha",
  "salicylic acid",
  "glycolic acid",
  "lactic acid",
  "mandelic acid",
  "polyhydroxy acid",
  "alpha hydroxy",
  "beta hydroxy",
  "hyaluronic acid",
  "niacinamide",
  "ascorbic acid",
  "exfoliant",
  "chemical exfoliant",
  "physical exfoliant",
  "eye cream",
  "cream",
  "spot treatment",
  "lip balm",
  "peptides",
  "ceramide",
  "ceramides",
  "alpha arbutin",
  "kojic acid",
  "azelaic acid",
  "benzoyl peroxide",
  "tretinoin",
  "adapalene",
  "retinoid",
  "bakuchiol",
  "squalane",
  "centella",
  "cica",
  "tiger grass",
  "tranexamic acid",
  "ferulic acid",
  "snail",
  "snail mucin",
  "propolis",
  "tea tree",
  "witch hazel",
  "aloe",
  "collagen",
  "zinc",
  "sulfur",
];

const BRAND_NAMES = [
  "cerave",
  "la mer",
  "lamer",
  "the ordinary",
  "ordinary",
  "neutrogena",
  "paula's choice",
  "paula choice",
  "cosrx",
  "skinceuticals",
  "drunk elephant",
  "kiehl",
  "vanicream",
  "cetaphil",
  "eucerin",
  "la roche",
  "roche posay",
  "bioderma",
  "aveeno",
  "olay",
  "differin",
  "supergoop",
  "elta",
  "innisfree",
  "laneige",
  "clinique",
  "estee lauder",
  "fresh",
  "glossier",
  "skin1004",
  "skin 1004",
  "purito",
  "beauty of joseon",
  "joseon",
  "some by mi",
  "romand",
  "roment",
  "isntree",
  "round lab",
  "anua",
  "torriden",
  "ma:nyo",
  "mediheal",
  "klairs",
  "pyunkang yul",
  "soonjung",
  "etude",
  "illiyoon",
  "zeroid",
  "aestura",
  "elmt",
  "goodal",
  "haruharu",
  "byoma",
  "inkey",
  "geek",
  "geek and gorgeous",
  "facetheory",
  "q+a",
];

const QUERY_STOPWORDS = new Set([
  "best",
  "for",
  "the",
  "a",
  "an",
  "and",
  "or",
  "with",
  "my",
  "recommended",
  "good",
  "top",
  "any",
  "some",
  "that",
  "this",
  "what",
  "which",
]);

const QUERY_SYNONYMS: [string, string][] = [
  ["salicylic acid", "bha"],
  ["salicylic", "bha"],
  ["beta hydroxy acid", "bha"],
  ["glycolic acid", "aha"],
  ["lactic acid", "aha"],
  ["mandelic acid", "aha"],
  ["alpha hydroxy acid", "aha"],
  ["ascorbic acid", "vitamin c"],
  ["l-ascorbic", "vitamin c"],
  ["ascorbic", "vitamin c"],
  ["vitamin b3", "niacinamide"],
  ["nicotinamide", "niacinamide"],
  ["tiger grass", "centella"],
  ["cica", "centella"],
  ["centella asiatica", "centella"],
  ["retinal", "retinol"],
  ["retinoid", "retinol"],
  ["sodium hyaluronate", "hyaluronic acid"],
  ["polyhydroxy acid", "pha"],
  ["gluconolactone", "pha"],
];

function normalizeQuery(q: string): string {
  let s = q
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

  for (const [phrase, canonical] of QUERY_SYNONYMS) {
    const escaped = phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/g, "\\s+");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    s = s.replace(re, canonical);
  }
  s = s.replace(/\s+/g, " ").trim();

  const words = s.split(/\s+/).filter((w) => w.length > 0 && !QUERY_STOPWORDS.has(w));
  return words.join(" ").replace(/\s+/g, " ").trim();
}

function isCategoryQuery(q: string): boolean {
  const s = q.toLowerCase().trim().replace(/\s+/g, " ");
  if (!s) return false;
  if (BRAND_NAMES.some((b) => s.includes(b))) return false;
  if (s.split(/\s+/).filter(Boolean).length > 2) return false;
  return CATEGORY_KEYWORDS.some((kw) => s.includes(kw));
}

const INGREDIENT_SYNONYMS: Record<string, string[]> = {
  bha: ["bha", "salicylic"],
  aha: ["aha", "glycolic", "lactic", "mandelic"],
  pha: ["pha", "gluconolactone", "galactose"],
  "vitamin c": ["vitamin c", "ascorbic", "l-ascorbic"],
  retinol: ["retinol", "retinal", "retinoid"],
  niacinamide: ["niacinamide", "vitamin b3", "nicotinamide"],
  "hyaluronic acid": ["hyaluronic", "ha ", "sodium hyaluronate"],
  centella: ["centella", "cica", "tiger grass", "asiatica"],
};

function filterRelevantText(text: string, query: string): string {
  const lines = text.split("\n");
  const raw = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  const qNorm = raw.join(" ");
  const keywords = new Set<string>(raw);
  for (const [term, syns] of Object.entries(INGREDIENT_SYNONYMS)) {
    if (qNorm.includes(term) || raw.some((w) => term.includes(w))) syns.forEach((s) => keywords.add(s));
  }
  if (keywords.size === 0) return text;
  const kwArr = Array.from(keywords);
  const filtered = lines
    .filter((line) => {
      const lower = line.toLowerCase();
      return kwArr.some((k) => lower.includes(k.trim()));
    })
    .join("\n");
  const minLength = 300;
  return filtered.trim().length >= minLength ? filtered : text;
}

function truncateAtWordBoundary(text: string, maxChars: number): string {
  if (text.length <= maxChars) return text;
  const cut = text.slice(0, maxChars);
  const lastSpace = cut.lastIndexOf(" ");
  return lastSpace > maxChars >> 1 ? cut.slice(0, lastSpace) : cut;
}

function extractJsonObject(raw: string): string {
  const stripped = raw
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const objMatch = stripped.match(/\{[\s\S]*\}/);
  return objMatch ? objMatch[0] : stripped;
}

function parseProductJson(raw: string): {
  pros: string[];
  cons: string[];
  skinTypes: string[];
  whoShouldUse: string;
} {
  const empty = { pros: [] as string[], cons: [] as string[], skinTypes: [] as string[], whoShouldUse: "" };
  const str = extractJsonObject(raw.trim());
  try {
    const parsed = JSON.parse(str);
    return {
      pros: Array.isArray(parsed.pros) ? parsed.pros : empty.pros,
      cons: Array.isArray(parsed.cons) ? parsed.cons : empty.cons,
      skinTypes: Array.isArray(parsed.skinTypes) ? parsed.skinTypes : empty.skinTypes,
      whoShouldUse: typeof parsed.whoShouldUse === "string" ? parsed.whoShouldUse.trim() : "",
    };
  } catch {
    return empty;
  }
}

type CategoryProduct = {
  name: string;
  pros: string[];
  cons: string[];
  skin_type: string[];
};

function parseCategoryJson(raw: string): {
  recommended_products: CategoryProduct[];
  general_pros: string[];
  general_cons: string[];
} {
  const empty = {
    recommended_products: [] as CategoryProduct[],
    general_pros: [] as string[],
    general_cons: [] as string[],
  };
  const str = extractJsonObject(raw.trim());
  try {
    const parsed = JSON.parse(str);
    const products = Array.isArray(parsed.recommended_products)
      ? parsed.recommended_products
          .filter((p: unknown) => p && typeof (p as { name?: string }).name === "string")
          .map((p: { name: string; pros?: string[]; cons?: string[]; skin_type?: string[]; skinTypes?: string[] }) => {
            const skinType = Array.isArray(p.skin_type) ? p.skin_type : Array.isArray(p.skinTypes) ? p.skinTypes : [];
            return {
              name: String(p.name).trim(),
              pros: Array.isArray(p.pros) ? p.pros : [],
              cons: Array.isArray(p.cons) ? p.cons : [],
              skin_type: skinType,
            };
          })
      : [];
    return {
      recommended_products: products,
      general_pros: Array.isArray(parsed.general_pros) ? parsed.general_pros : [],
      general_cons: Array.isArray(parsed.general_cons) ? parsed.general_cons : [],
    };
  } catch {
    return empty;
  }
}

const SKIN_TYPE_ORDER = ["dry", "oily", "combination", "sensitive", "acne prone"];

function buildBySkinType(products: CategoryProduct[]): Record<string, CategoryProduct[]> {
  const by: Record<string, CategoryProduct[]> = {};
  for (const st of SKIN_TYPE_ORDER) by[st] = [];
  for (const p of products) {
    const types = p.skin_type?.length ? p.skin_type : [];
    for (const st of types) {
      if (by[st]) by[st].push(p);
    }
  }
  return by;
}

export async function POST(req: NextRequest) {
  const ip = getClientIp(req);
  const { allowed } = checkRateLimit(ip);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait." },
      { status: 429 }
    );
  }

  try {
  let text: string;
  let query: string;
  try {
    const body = await req.json();
    text = typeof body?.text === "string" ? body.text : "";
    query = typeof body?.query === "string" ? body.query : "";
  } catch (parseErr) {
    console.error("[analyze] Body parse failed:", parseErr);
    return NextResponse.json(
      { error: "Invalid request body. Expected JSON with text and query." },
      { status: 400 }
    );
  }

  const productName = query?.trim()
    ? query.trim().replace(/\b\w/g, (c) => c.toUpperCase())
    : "Product";

  const emptyProductResult = {
    mode: "product" as const,
    product_name: productName,
    pros: [] as string[],
    cons: [] as string[],
    suitable_for: [] as string[],
    who_should_use: "" as string,
    error: "" as string,
  };

  const emptyBySkinType: Record<string, CategoryProduct[]> = {};
  for (const st of SKIN_TYPE_ORDER) emptyBySkinType[st] = [];
  const emptyCategoryResult = {
    mode: "category" as const,
    recommended_products: [] as CategoryProduct[],
    by_skin_type: emptyBySkinType,
    general_pros: [] as string[],
    general_cons: [] as string[],
  };

  text = filterRelevantText(text, query);
  text = truncateAtWordBoundary(text, 10000);

  if (!text?.trim()) {
    return NextResponse.json(
      isCategoryQuery(query)
        ? { ...emptyCategoryResult }
        : { ...emptyProductResult, error: "No discussion text to analyze" }
    );
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    console.error("[analyze] Missing GROQ_API_KEY");
    return NextResponse.json(
      { error: "Missing GROQ_API_KEY" },
      { status: 503 }
    );
  }

  const categoryMode = isCategoryQuery(query);
  const normalizedQuery = normalizeQuery(query);
  const cacheMode = categoryMode ? "category" : "product";
  const safeQuery = query.trim().replace(/[`\\]/g, " ");

  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  const supabase =
    supabaseUrl && supabaseAnonKey
      ? createClient(supabaseUrl, supabaseAnonKey)
      : null;

  const recordSearchQuery = () => {
    if (supabase && normalizedQuery) {
      supabase.from("search_queries").insert({ query: normalizedQuery }).then(() => {}, () => {});
    }
  };

  if (supabase) {
    const { data: cached } = await supabase
      .from("analysis_cache")
      .select("result")
      .eq("query", normalizedQuery)
      .eq("mode", cacheMode)
      .limit(1)
      .maybeSingle();
    if (cached?.result) {
      recordSearchQuery();
      return NextResponse.json(cached.result);
    }
  }

  const categoryPrompt = `You analyze Reddit skincare discussions. The user searched for: "${safeQuery}".

CRITICAL – Two cases:
1) If they searched for an INGREDIENT (e.g. Salicylic Acid, BHA, Hyaluronic Acid, Niacinamide, Retinol, Vitamin C, Glycolic Acid, AHA): list 8–15 specific PRODUCTS that contain or feature this ingredient (e.g. for Salicylic Acid/BHA: Paula's Choice 2% BHA, CeraVe SA cleanser, The Ordinary Salicylic Acid, etc.). You MUST fill recommended_products with real product names from the discussion.
2) If they searched for a product TYPE (moisturizer, cleanser, serum, sunscreen): only list products of that type. Do NOT mix in other types.

Every product in recommended_products must be a real product people mentioned. For each product give BRIEF pros and cons (1–3 short phrases). Use the exact field name "skin_type" (array of strings) for skin types if mentioned; only use: "dry", "oily", "combination", "sensitive", "acne prone". Then list general_pros and general_cons for this category/ingredient.

Discussion text:
${truncateAtWordBoundary(text, 8000)}

Return valid JSON only. Use "skin_type" not "skinTypes". If no product is clearly mentioned in the discussion, return recommended_products as []. Do NOT invent products.
{
  "recommended_products": [
    { "name": "Brand Product Name", "pros": ["brief pro 1"], "cons": ["brief con"], "skin_type": ["dry", "sensitive"] }
  ],
  "general_pros": ["general pro 1"],
  "general_cons": ["general con 1"]
}`;

  const productPrompt = `You analyze Reddit discussions about ONE SPECIFIC PRODUCT. The user searched for exactly this product: "${safeQuery}".

Discussion text:
${truncateAtWordBoundary(text, 8000)}

Your task: Extract information ONLY about "${safeQuery}". Do NOT list or mention other products or brands. Focus solely on what people said about this product.

1. pros – detailed pros (e.g. "very hydrating", "good for sensitive skin", "affordable", "absorbs quickly"). Include 5–12 specific points if mentioned.
2. cons – detailed cons (e.g. "expensive", "caused breakouts for some", "heavy texture"). Include 3–10 specific points if mentioned.
3. skinTypes – who this product suits: only use "dry", "oily", "combination", "sensitive", "acne prone" when clearly mentioned in the discussion. Also describe in one phrase what kind of people might benefit (e.g. "people with dry or sensitive skin") if you can infer it.

Return ONLY valid JSON, no markdown. You may include "whoShouldUse" (one short sentence, e.g. "People with dry or sensitive skin"):
{"pros": ["...", "..."], "cons": ["...", "..."], "skinTypes": ["..."], "whoShouldUse": "optional one sentence"}`;

  const GROQ_TIMEOUT_MS = 15000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GROQ_TIMEOUT_MS);

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [
          {
            role: "user",
            content: categoryMode ? categoryPrompt : productPrompt,
          },
        ],
        temperature: 0.2,
        response_format: { type: "json_object" },
      }),
      signal: controller.signal,
    });

    const data = await response.json();

    if (!response.ok) {
      const status = response.status;
      const errMsg =
        status === 429
          ? "Too many requests. Please wait a moment and try again."
          : data?.error?.message ?? `Groq API ${status}`;
      console.error("[analyze] Groq API error:", status, errMsg);
      return NextResponse.json(
        { error: errMsg },
        { status: status >= 400 ? status : 502 }
      );
    }

    const content = data?.choices?.[0]?.message?.content;
    if (!content || typeof content !== "string") {
      console.error("[analyze] Groq returned no content");
      return NextResponse.json(
        { error: "Groq returned no content" },
        { status: 502 }
      );
    }

    if (categoryMode) {
      if (content.length > 20000) {
        return NextResponse.json(emptyCategoryResult);
      }
      const { recommended_products, general_pros, general_cons } = parseCategoryJson(content);
      const by_skin_type = buildBySkinType(recommended_products);
      const finalResponse = {
        mode: "category" as const,
        recommended_products,
        by_skin_type,
        general_pros,
        general_cons,
      };
      if (supabase) {
        supabase.from("analysis_cache").upsert(
          { query: normalizedQuery, mode: cacheMode, result: finalResponse },
          { onConflict: "query,mode" }
        ).then(() => {}, () => {});
      }
      recordSearchQuery();
      return NextResponse.json(finalResponse);
    }

    const { pros, cons, skinTypes, whoShouldUse } = parseProductJson(content);
    const finalResponse = {
      mode: "product" as const,
      product_name: productName,
      pros,
      cons,
      suitable_for: skinTypes ?? [],
      who_should_use: whoShouldUse ?? "",
      error: "",
    };
    if (supabase) {
      supabase.from("analysis_cache").upsert(
        { query: normalizedQuery, mode: cacheMode, result: finalResponse },
        { onConflict: "query,mode" }
      ).then(() => {}, () => {});
    }
    recordSearchQuery();
    return NextResponse.json(finalResponse);
  } catch (e) {
    const errMsg =
      (e as { name?: string })?.name === "AbortError"
        ? "Request timed out. Please try again."
        : e instanceof Error
          ? e.message
          : "Analyze failed";
    console.error("[analyze] Groq request failed:", e);
    return NextResponse.json(
      { error: errMsg },
      { status: 502 }
    );
  } finally {
    clearTimeout(timeoutId);
  }

  } catch (e) {
    const message = e instanceof Error ? e.message : "Analyze failed";
    console.error("[analyze] Error:", e);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}