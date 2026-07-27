export type PopularSearch = {
  query: string;
  count: number;
  lastSearchedAt: string;
};

type PopularSearchesResponse = {
  ok?: boolean;
  limit?: number;
  searches?: PopularSearch[];
};

const FALLBACK_QUERIES = [
  "თბილისში remote frontend 2500 ლარიდან",
  "ბათუმში მარკეტინგის მენეჯერი",
  "სენიორ ბექენდ დეველოპერი Node",
  "დისტანციური დიზაინერი Figma",
  "ქუთაისში ბუღალტერი სრული განაკვეთი",
  "junior QA ინჟინერი თბილისი",
  "HR მენეჯერი გამოცდილებით",
  "უახლესი DevOps ვაკანსიები",
  "გაყიდვების მენეჯერი 2000+",
  "პროდუქტის დიზაინერი ოფისიდან",
  "ფულსტეკ React და Node",
  "მზარეული რესტორანში თბილისი",
];

function getSamushaoApiBaseUrl() {
  return (
    process.env.SAMUSHAO_API_BASE ||
    process.env.NEXT_PUBLIC_SAMUSHAO_API_BASE ||
    "https://samushao.ge"
  ).replace(/\/$/, "");
}

function normalizeQueries(searches: PopularSearch[]): string[] {
  const seen = new Set<string>();
  const queries: string[] = [];

  for (const item of searches) {
    const query = item.query?.trim();
    if (!query) continue;
    const key = query.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    queries.push(query);
  }

  return queries;
}

export function getFallbackPopularQueries(count = 6): string[] {
  return FALLBACK_QUERIES.slice(0, count);
}

export async function fetchPopularQueries(limit = 50): Promise<string[]> {
  const safeLimit = Math.min(Math.max(limit, 1), 100);
  const res = await fetch(
    `${getSamushaoApiBaseUrl()}/api/site-searches/popular?limit=${safeLimit}`,
    { cache: "no-store" },
  );
  if (!res.ok) {
    throw new Error(`popular searches failed: ${res.status}`);
  }

  const data = (await res.json()) as PopularSearchesResponse;
  const queries = normalizeQueries(data.searches ?? []);
  if (queries.length === 0) {
    throw new Error("popular searches empty");
  }
  return queries;
}
