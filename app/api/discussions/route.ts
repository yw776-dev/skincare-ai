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
        "User-Agent": "Mozilla/5.0 AI-Skincare-App",
      },
      next: { revalidate: 0 },
    });

    let data: unknown;
    try {
      data = await res.json();
    } catch {
      return NextResponse.json({
        text: "",
        error: "Discussion source returned an unexpected response. Please try again.",
      });
    }

    if (!res.ok) {
      const msg = data && typeof data === "object" && "message" in data && typeof (data as { message: unknown }).message === "string"
        ? (data as { message: string }).message
        : `Request failed (${res.status})`;
      return NextResponse.json({ text: "", error: msg });
    }

    if (!data || typeof data !== "object") {
      return NextResponse.json({
        text: "",
        error: "No discussions found for this search. Try a different term.",
      });
    }

    const payload = data as { data?: { children?: unknown[] }; error?: number; message?: string };
    if (payload.error === 429 || (typeof payload.message === "string" && payload.message.toLowerCase().includes("rate limit"))) {
      return NextResponse.json({ text: "", error: "Too many requests. Please try again in a moment." });
    }

    const children = payload.data?.children;
    const posts = Array.isArray(children) ? children : [];
    const combinedText = posts
      .map((p: unknown) => {
        const d = (p as { data?: { title?: string; selftext?: string } })?.data ?? {};
        return [d.title ?? "", d.selftext ?? ""].filter(Boolean).join(" ");
      })
      .filter(Boolean)
      .join("\n\n");

    if (!combinedText.trim()) {
      return NextResponse.json({
        text: "",
        postsCount: 0,
        error: "No discussions found for this search. Try a different term.",
      });
    }

    return NextResponse.json({
      text: combinedText,
      postsCount: posts.length,
    });
  } catch (e) {
    console.error("Discussions fetch error:", e);
    return NextResponse.json({
      text: "",
      error: e instanceof Error ? e.message : "Failed to load discussions",
    });
  }
}