/**
 * Latin ↔ Mkhedruli helpers for Georgian typed without a Georgian keyboard.
 *
 * This is only a phonetic HINT + reverse map. Correct literary spelling
 * (ტ vs თ, ღ vs ჰ, …) is the smart planner’s job — do not hardcode roles.
 *
 * Phonetic defaults: t→ტ, th→თ. Cities with bare-t→თ live in CITY_LATIN.
 */

/** Place names where bare latin "t" is თ (not ტ). */
const CITY_LATIN: Record<string, string> = {
  tbilisi: "თბილისი",
  batumi: "ბათუმი",
  qutaisi: "ქუთაისი",
  kutaisi: "ქუთაისი",
  rustavi: "რუსთავი",
  telavi: "თელავი",
  zugdidi: "ზუგდიდი",
  gori: "გორი",
  poti: "ფოთი",
};

/** Digraphs / trigraphs first (longest match). */
const DIGRAPHS: Array<[string, string]> = [
  ["tch", "ჭ"],
  ["zh", "ჟ"],
  ["gh", "ღ"],
  ["kh", "ხ"],
  ["sh", "შ"],
  ["ch", "ჩ"],
  ["ts", "ც"],
  ["dz", "ძ"],
  ["th", "თ"],
];

const SINGLE: Record<string, string> = {
  a: "ა",
  b: "ბ",
  g: "გ",
  d: "დ",
  e: "ე",
  v: "ვ",
  z: "ზ",
  t: "ტ",
  i: "ი",
  k: "კ",
  l: "ლ",
  m: "მ",
  n: "ნ",
  o: "ო",
  p: "პ",
  r: "რ",
  s: "ს",
  u: "უ",
  f: "ფ",
  q: "ქ",
  y: "ყ",
  w: "წ",
  x: "ხ",
  j: "ჯ",
  h: "ჰ",
  c: "ც",
};

/** Mkhedruli → latin (lossy: თ and ტ both become t). */
const REVERSE_SINGLE: Record<string, string> = {
  ა: "a",
  ბ: "b",
  გ: "g",
  დ: "d",
  ე: "e",
  ვ: "v",
  ზ: "z",
  თ: "t",
  ი: "i",
  კ: "k",
  ლ: "l",
  მ: "m",
  ნ: "n",
  ო: "o",
  პ: "p",
  ჟ: "zh",
  რ: "r",
  ს: "s",
  ტ: "t",
  უ: "u",
  ფ: "f",
  ქ: "q",
  ღ: "gh",
  ყ: "y",
  შ: "sh",
  ჩ: "ch",
  ც: "ts",
  ძ: "dz",
  წ: "w",
  ჭ: "tch",
  ხ: "x",
  ჯ: "j",
  ჰ: "h",
};

function hasGeorgian(text: string): boolean {
  return /[\u10A0-\u10FF]/.test(text);
}

function isLatinWord(token: string): boolean {
  return /^[a-z]+$/i.test(token);
}

function isGeorgianWord(token: string): boolean {
  return /^[\u10A0-\u10FF]+$/u.test(token);
}

/** Skills/tools that must stay English (not phonetic-mapped into Mkhedruli). */
function isLikelyEnglishSkill(token: string): boolean {
  const t = token.toLowerCase();
  return /^(javascript|typescript|python|java|react|angular|vue|node|nodejs|next|nextjs|docker|kubernetes|k8s|devops|figma|excel|html|css|sql|php|ruby|golang|rust|swift|kotlin|android|ios|flutter|aws|azure|gcp|linux|git|jira|remote|frontend|backend|fullstack|full-stack|front-end|back-end|developer|programmer|engineer|software|accountant|accounting|bookkeeper|driver|nurse|doctor|lawyer|manager|js|ts|hr|it|horeca|sap|office|sales|finance|design|legal|admin|security|marketing)$/i.test(
    t,
  );
}

/** Phonetic latin → Mkhedruli (hint only; may be wrong on rare თ spellings). */
export function transliterateToken(token: string): string {
  const lower = token.toLowerCase();
  if (CITY_LATIN[lower]) return CITY_LATIN[lower];

  let i = 0;
  let out = "";
  while (i < lower.length) {
    let matched = false;
    for (const [lat, ka] of DIGRAPHS) {
      if (lower.startsWith(lat, i)) {
        out += ka;
        i += lat.length;
        matched = true;
        break;
      }
    }
    if (matched) continue;
    const ch = lower[i];
    out += SINGLE[ch] || ch;
    i += 1;
  }
  return out;
}

/** Mkhedruli → informal latin (so KA queries also match latin job text). */
export function reverseTransliterateToken(token: string): string {
  let out = "";
  for (const ch of token) {
    out += REVERSE_SINGLE[ch] || ch;
  }
  return out;
}

function uniqueTerms(terms: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const term of terms) {
    const t = term.trim();
    if (!t) continue;
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(t);
  }
  return out;
}

/**
 * Enrich a query that may contain Georgian typed in Latin letters.
 * Returns phonetic Mkhedruli + latin twin. Smart planner corrects spelling.
 */
export function enrichLatinGeorgianQuery(rawQuery: string): {
  query: string;
  variants: string[];
  changed: boolean;
} {
  const raw = rawQuery.trim();
  if (!raw) return { query: "", variants: [], changed: false };

  const tokens = raw.split(/\s+/).filter(Boolean);
  const mapped = tokens.map((tok) => {
    if (!isLatinWord(tok)) return tok;
    if (isLikelyEnglishSkill(tok)) return tok;
    return transliterateToken(tok);
  });

  const transliterated = mapped.join(" ");
  const wholeCity = CITY_LATIN[raw.toLowerCase()];
  const query =
    wholeCity || (hasGeorgian(transliterated) ? transliterated : raw);

  const queryTokens = query.split(/\s+/).filter(Boolean);
  const reverseMapped = queryTokens
    .map((tok) => (isGeorgianWord(tok) ? reverseTransliterateToken(tok) : tok))
    .join(" ");

  // If user typed latin city alias, keep that spelling too.
  const cityLatins = queryTokens.flatMap((tok) => {
    if (!isGeorgianWord(tok)) return [];
    return Object.entries(CITY_LATIN)
      .filter(([, ka]) => ka === tok)
      .map(([lat]) => lat);
  });

  const variants = uniqueTerms([
    raw,
    transliterated,
    query,
    reverseMapped,
    ...mapped,
    ...queryTokens,
    ...reverseMapped.split(/\s+/),
    ...cityLatins,
  ]);

  const changed =
    query !== raw || transliterated !== raw || reverseMapped !== raw;
  return { query, variants, changed };
}

/** Primary Georgian (phonetic/city) + latin twin for OR search. */
export function bilingualSearchTerms(rawQuery: string): {
  q: string;
  qAlternates: string[];
  query: string;
  variants: string[];
} {
  const enriched = enrichLatinGeorgianQuery(rawQuery);
  const q = enriched.query || rawQuery.trim();
  const qAlternates = enriched.variants.filter(
    (v) => v.toLowerCase() !== q.toLowerCase(),
  );
  return {
    q,
    qAlternates,
    query: enriched.query,
    variants: enriched.variants,
  };
}

/** True when the query looks like Latin-typed Georgian (not an EN skill). */
export function looksLikeLatinGeorgian(rawQuery: string): boolean {
  const tokens = rawQuery.trim().split(/\s+/).filter(Boolean);
  if (!tokens.length) return false;
  return tokens.some(
    (tok) => isLatinWord(tok) && !isLikelyEnglishSkill(tok) && tok.length >= 3,
  );
}
