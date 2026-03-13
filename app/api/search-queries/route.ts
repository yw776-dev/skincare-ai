import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json({ queries: [] });
  }
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const { data: rows, error } = await supabase
    .from("search_queries")
    .select("query")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error || !rows?.length) {
    return NextResponse.json({ queries: [] });
  }
  const countByQuery: Record<string, number> = {};
  for (const row of rows) {
    const q = (row.query ?? "").trim().toLowerCase();
    if (!q) continue;
    countByQuery[q] = (countByQuery[q] ?? 0) + 1;
  }
  const top = Object.entries(countByQuery)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([query]) => query);
  return NextResponse.json({ queries: top });
}
