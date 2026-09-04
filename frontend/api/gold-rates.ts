// Vercel serverless proxy for the gold rate feed.
//
// api.goldprice.dev sends no Access-Control-Allow-Origin header and answers
// OPTIONS with 405, so the browser cannot call it directly — this endpoint is
// the only reason the site is not fully static.

export const config = { runtime: "edge" };

type GoldRates = {
  gold22k: number;
  gold24k: number;
  silver: number;
  updatedAt: string;
};

type CaratResponse = { price_gram_22k: string; price_gram_24k: string; timestamp: string };
type ConvertResponse = { result: string };

// Rates only move a few times a day, and the upstream rate-limits to 30 req/window,
// so hold a warm copy per serverless instance and serve stale on upstream failure.
const CACHE_MS = 15 * 60 * 1000;
let cached: { data: GoldRates; expiresAt: number } | null = null;

async function fetchRates(): Promise<GoldRates> {
  const [caratRes, silverRes] = await Promise.all([
    fetch("https://api.goldprice.dev/v1/carat?currency=INR"),
    fetch("https://api.goldprice.dev/v1/convert?from=XAG&to=INR&amount=1&unit=gram"),
  ]);
  if (!caratRes.ok || !silverRes.ok) {
    throw new Error(`gold rate fetch failed: carat=${caratRes.status} silver=${silverRes.status}`);
  }

  const carat = (await caratRes.json()) as CaratResponse;
  const silver = (await silverRes.json()) as ConvertResponse;

  return {
    gold22k: Math.round(Number(carat.price_gram_22k)),
    gold24k: Math.round(Number(carat.price_gram_24k)),
    silver: Math.round(Number(silver.result)),
    updatedAt: carat.timestamp,
  };
}

export default async function handler(): Promise<Response> {
  const now = Date.now();
  if (cached && cached.expiresAt > now) return json(cached.data);

  try {
    const data = await fetchRates();
    cached = { data, expiresAt: now + CACHE_MS };
    return json(data);
  } catch (error) {
    if (cached) return json(cached.data);
    console.error(error);
    return new Response(JSON.stringify({ error: "Gold rate unavailable" }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}

function json(data: GoldRates): Response {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      "content-type": "application/json",
      // Let Vercel's edge cache absorb repeat hits between cold starts.
      "cache-control": "public, s-maxage=900, stale-while-revalidate=3600",
    },
  });
}
