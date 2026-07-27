/** Samushao scraped-job categories (stable ids from /api/scraped-jobs/categories). */
export const JOB_CATEGORIES = [
  { id: 1, name: "საოფისე" },
  { id: 2, name: "მომხმარებელთან ურთიერთობები" },
  { id: 3, name: "გაყიდვები" },
  { id: 4, name: "საბანკო-საფინანსო" },
  { id: 5, name: "საწყობი და წარმოება" },
  { id: 6, name: "საცალო ვაჭრობა" },
  { id: 7, name: "მზარეული" },
  { id: 8, name: "აზარტული" },
  { id: 9, name: "მენეჯმენტი" },
  { id: 10, name: "ფარმაცია" },
  { id: 11, name: "მიმტანი" },
  { id: 12, name: "ინჟინერია" },
  { id: 13, name: "ლოჯისტიკა" },
  { id: 14, name: "სამედიცინო" },
  { id: 15, name: "უსაფრთხოება" },
  { id: 16, name: "დისტრიბუცია" },
  { id: 17, name: "ინფორმაციული ტექნოლოგიები" },
  { id: 18, name: "დიასახლისი" },
  { id: 19, name: "სხვა" },
  { id: 20, name: "ბუღალტერია" },
  { id: 21, name: "მძღოლი" },
  { id: 22, name: "Web/Digital/Design" },
  { id: 23, name: "ექთანი" },
  { id: 24, name: "ექიმი" },
  { id: 25, name: "ადმინისტრატორი" },
  { id: 26, name: "HR" },
  { id: 27, name: "იურიდიული" },
  { id: 28, name: "სასტუმრო, რესტორანი, კაფე, HoReCa" },
  { id: 29, name: "ტურიზმი" },
  { id: 30, name: "მოლარე-კონსულტანტი" },
  { id: 31, name: "განათლება" },
  { id: 32, name: "რემონტი, მშენებლობა" },
  { id: 33, name: "დასუფთავება" },
  { id: 34, name: "დაცვა, უსაფრთხოება" },
  { id: 35, name: "მზარეული, მცხობელი, დამხმარე" },
  { id: 36, name: "მკერავი" },
  { id: 37, name: "მუშა, მტვირთავი" },
  { id: 38, name: "სოფლის მეურნეობა" },
  { id: 39, name: "ცხოველების მოვლა" },
  { id: 40, name: "ფაბრიკა, წარმოება" },
  { id: 41, name: "ხელოსანი, შეკეთება, მონტაჟი" },
  { id: 42, name: "ძიძა, მომვლელი, დამხმარე" },
  { id: 10000, name: "მარკეტინგი" },
] as const;

/**
 * Sector / informal aliases → category id.
 * Do NOT put person job titles here (ბუღალტერი, მძღოლი, accountant) —
 * those must go through bilingual role expansion so EN/KA stay consistent.
 */
const CATEGORY_ALIASES: Record<string, number> = {
  office: 1,
  "office work": 1,
  საოფისი: 1,
  saofise: 1,
  saopise: 1,
  it: 17,
  "აითი": 17,
  "აიტი": 17,
  horeca: 28,
  ჰორეკა: 28,
  sales: 3,
  gayidvebi: 3,
  gayidva: 3,
  finance: 4,
  ბანკი: 4,
  buhalteria: 20,
  bugalteria: 20,
  hr: 26,
  marketing: 10000,
  marketingi: 10000,
  design: 22,
  დიზაინი: 22,
  loftistika: 13,
  logistika: 13,
  injineria: 12,
};

function normalize(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()'"]/g, " ")
    .replace(/\s+/g, " ");
}

export type MatchedCategory = {
  id: number;
  name: string;
};

export function categoryById(id: number): MatchedCategory | null {
  const found = JOB_CATEGORIES.find((c) => c.id === id);
  return found ? { id: found.id, name: found.name } : null;
}

export function categoryByName(name: string): MatchedCategory | null {
  const n = normalize(name);
  if (!n) return null;
  const found = JOB_CATEGORIES.find((c) => normalize(c.name) === n);
  return found ? { id: found.id, name: found.name } : null;
}

/**
 * Match a premade sector category.
 * Exact category name or sector alias only — never person titles like
 * "ბუღალტერი" via fuzzy stem of "ბუღალტერია".
 */
export function matchCategoryFromQuery(rawQuery: string): MatchedCategory | null {
  const raw = normalize(rawQuery);
  if (!raw) return null;

  const stripped = raw
    .replace(
      /^(ვეძებ|მინდა|მაპოვე|იპოვე|ძებნა|search|find|looking for)\s+/i,
      "",
    )
    .replace(
      /\s+(ვაკანსია|ვაკანსიები|სამუშაო|სამსახური|job|jobs|work)$/i,
      "",
    )
    .trim();

  const candidates = [raw, stripped].filter(Boolean);

  for (const candidate of candidates) {
    const aliasId = CATEGORY_ALIASES[candidate];
    if (aliasId != null) {
      const cat = categoryById(aliasId);
      if (cat) return cat;
    }

    for (const cat of JOB_CATEGORIES) {
      const name = normalize(cat.name);
      if (candidate === name) return { id: cat.id, name: cat.name };
    }
  }

  return null;
}

/**
 * Related sector for fill-in results after title/description matches.
 * e.g. ბუღალტერი / accountant → ბუღალტერია (20)
 */
export function relatedCategoryFromTerms(
  terms: string[],
): MatchedCategory | null {
  for (const term of terms) {
    const n = normalize(term);
    if (!n || n.length < 3) continue;

    const exact = matchCategoryFromQuery(n);
    if (exact) return exact;

    let best: MatchedCategory | null = null;
    for (const cat of JOB_CATEGORIES) {
      if (cat.id === 19) continue;
      const name = normalize(cat.name);
      // Person title stem of sector: ბუღალტერი ⊂ ბუღალტერია, მძღოლი = მძღოლი
      const stemHit =
        name === n ||
        (n.length >= 4 && name.startsWith(n) && name.length - n.length <= 3) ||
        (name.length >= 4 && n.startsWith(name) && n.length - name.length <= 3);
      if (!stemHit) continue;
      if (!best || name.length < normalize(best.name).length) {
        best = { id: cat.id, name: cat.name };
      }
    }
    if (best) return best;
  }
  return null;
}

export function categoriesPromptList(): string {
  return JOB_CATEGORIES.map((c) => `${c.id}:${c.name}`).join(" | ");
}
