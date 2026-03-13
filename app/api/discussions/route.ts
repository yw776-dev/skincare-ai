import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q");
  if (!q?.trim()) {
    return NextResponse.json({ text: "", error: "Missing query" });
  }

  const searchQuery = `${q.trim()} skincare`;
  const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(searchQuery)}&limit=25`;

  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) SkinSignal/1.0",
      },
      next: { revalidate: 0 },
    });

    let data: { data?: { children?: unknown[] }; error?: number; message?: string };
    try {
      data = await res.json();
    } catch {
      return NextResponse.json({ text: "", error: "Invalid response from Reddit" });
    }

    if (!res.ok) {
      return NextResponse.json({
        text: "",
        error: data?.message ?? `Reddit returned ${res.status}`,
      });
    }
    if (data?.error === 429 || data?.message?.toLowerCase().includes("rate limit")) {
      return NextResponse.json({ text: "", error: "Too many requests. Please try again in a moment." });
    }

    const children = data?.data?.children ?? [];
    const posts = Array.isArray(children) ? children : [];
    const combinedText = posts
      .map((p: unknown) => {
        const d = (p as { data?: { title?: string; selftext?: string } })?.data ?? {};
        return [d.title ?? "", d.selftext ?? ""].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join("\n\n");

    return NextResponse.json({
      text: combinedText || "",
      postsCount: posts.length,
      error: combinedText ? undefined : "No posts found",
    });
  } catch (e) {
    console.error("Discussions fetch error:", e);
    return NextResponse.json({
      text: "",
      error: e instanceof Error ? e.message : "Failed to fetch Reddit",
    });
  }
}