/**
 * Deterministic search intents: expand chat-like queries into fetch terms
 * + preferred hidden facets for relevance ranking.
 */

export type PreferFacets = {
  roleFamilies?: string[];
  skills?: string[];
  payCadence?: Array<"daily" | "monthly" | "hourly" | "unknown">;
};

export type SearchIntent = {
  id: string;
  /** Labels matched against the full query (normalized) */
  triggers: string[];
  /** Primary keyword for Samushao `q` */
  q: string;
  /** OR’d with q for recall */
  fetchTerms: string[];
  preferFacets: PreferFacets;
  interpretation: string;
};

function normalize(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

const INTENTS: SearchIntent[] = [
  {
    id: "day_labor",
    triggers: [
      "დღიური",
      "დღიურად",
      "დღის მუშა",
      "დღის სამუშაო",
      "ყოველდღიური",
      "ყოველდღიური ანაზღაურება",
      "daily",
      "daily job",
      "daily jobs",
      "day labor",
      "day labour",
      "day wage",
      "per day",
      // latin-typed Georgian
      "dgiuri",
      "dgiurad",
      "dghiuri",
      "dghiurad",
    ],
    q: "დღიური",
    fetchTerms: [
      "დღიური",
      "დღიურად",
      "დღის მუშა",
      "დღიური მუშა",
      "დღიური ანაზღაურება",
    ],
    preferFacets: {
      roleFamilies: ["day_labor"],
      payCadence: ["daily"],
    },
    interpretation: "დღიური / ყოველდღიური ანაზღაურების სამუშაოები",
  },
  {
    id: "javascript_dev",
    triggers: [
      "javascript",
      "java script",
      "java-script",
      "js",
      "javascirpt",
      "javasript",
    ],
    q: "javascript",
    fetchTerms: [
      "javascript",
      "js",
      "frontend",
      "front-end",
      "backend",
      "back-end",
      "fullstack",
      "full-stack",
      "node",
      "react",
    ],
    preferFacets: {
      roleFamilies: ["software_dev"],
      skills: ["javascript"],
    },
    interpretation: "JavaScript — frontend და backend დეველოპერები",
  },
  {
    id: "typescript_dev",
    triggers: ["typescript", "ts", "typescriptt"],
    q: "typescript",
    fetchTerms: [
      "typescript",
      "ts",
      "frontend",
      "front-end",
      "backend",
      "back-end",
      "fullstack",
      "node",
      "react",
    ],
    preferFacets: {
      roleFamilies: ["software_dev"],
      skills: ["typescript", "javascript"],
    },
    interpretation: "TypeScript — frontend და backend დეველოპერები",
  },
  // Role titles (frontend / პროგრამისტი / დეველოპერი / developer) are NOT
  // hardcoded here — Gemini expands them into a shared synonym cluster.
];

/**
 * Match a dedicated intent from the raw user query.
 * Prefers longer / more specific triggers.
 */
export function matchIntent(rawQuery: string): SearchIntent | null {
  const n = normalize(rawQuery);
  if (!n) return null;

  let best: SearchIntent | null = null;
  let bestLen = 0;

  for (const intent of INTENTS) {
    for (const trigger of intent.triggers) {
      const t = normalize(trigger);
      if (!t) continue;
      const exact = n === t;
      const contained =
        n.includes(t) ||
        n.split(/[\s,/|+]+/).some((tok) => tok === t);
      if (!exact && !contained) continue;
      const score = t.length + (exact ? 100 : 0);
      if (score > bestLen) {
        bestLen = score;
        best = intent;
      }
    }
  }

  return best;
}

export function intentToFilterFields(intent: SearchIntent): {
  q: string;
  qAlternates: string[];
  preferRoleFamilies?: string[];
  preferSkills?: string[];
  preferPayCadence?: PreferFacets["payCadence"];
  interpretation: string;
} {
  const alts = intent.fetchTerms.filter(
    (t) => t.toLowerCase() !== intent.q.toLowerCase(),
  );
  return {
    q: intent.q,
    qAlternates: alts.slice(0, 8),
    preferRoleFamilies: intent.preferFacets.roleFamilies,
    preferSkills: intent.preferFacets.skills,
    preferPayCadence: intent.preferFacets.payCadence,
    interpretation: intent.interpretation,
  };
}
