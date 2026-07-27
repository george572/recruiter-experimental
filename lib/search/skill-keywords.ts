/** Skills / languages / tools that must stay as text search (title + description). */
const SKILL_KEYWORDS = [
  "javascript",
  "typescript",
  "python",
  "java",
  "kotlin",
  "swift",
  "php",
  "ruby",
  "golang",
  "rust",
  "c#",
  "csharp",
  ".net",
  "dotnet",
  "react",
  "react.js",
  "reactjs",
  "vue",
  "vue.js",
  "vuejs",
  "angular",
  "next.js",
  "nextjs",
  "node.js",
  "nodejs",
  "nestjs",
  "django",
  "flask",
  "laravel",
  "spring",
  "sql",
  "mysql",
  "postgres",
  "postgresql",
  "mongodb",
  "redis",
  "aws",
  "azure",
  "gcp",
  "docker",
  "kubernetes",
  "k8s",
  "devops",
  "figma",
  "photoshop",
  "illustrator",
  "excel",
  "wordpress",
  "shopify",
  "android",
  "ios",
  "flutter",
  "react native",
  "graphql",
  "html",
  "css",
  "sass",
  "tailwind",
  "linux",
  "git",
  "jira",
  "salesforce",
  "sap",
  "1c",
] as const;

const SKILL_SET = new Set(SKILL_KEYWORDS.map((s) => s.toLowerCase()));

/** Common misspellings / short forms → canonical skill used for API search */
const SKILL_TYPOS: Record<string, string> = {
  javascirpt: "javascript",
  javasript: "javascript",
  javascrip: "javascript",
  "java-script": "javascript",
  js: "javascript",
  typescriptt: "typescript",
  ts: "typescript",
  reactjs: "react",
  "react js": "react",
  node: "node.js",
  next: "next.js",
  go: "golang",
};

/** Typo / short-form alts */
const SKILL_ALTERNATES: Record<string, string[]> = {
  javascript: ["js"],
  typescript: ["ts"],
  react: ["react.js", "reactjs"],
  "react.js": ["react", "reactjs"],
  reactjs: ["react", "react.js"],
  vue: ["vue.js", "vuejs"],
  "vue.js": ["vue", "vuejs"],
  "node.js": ["nodejs", "node"],
  nodejs: ["node.js", "node"],
  "next.js": ["nextjs", "next"],
  nextjs: ["next.js", "next"],
  golang: ["go"],
  postgres: ["postgresql"],
  postgresql: ["postgres"],
  csharp: ["c#", ".net"],
  "c#": ["csharp", ".net"],
  k8s: ["kubernetes"],
  kubernetes: ["k8s"],
};

/**
 * Role-family expansions for skills so "javascript" also pulls
 * frontend / backend titles into the candidate pool.
 */
const SKILL_ROLE_EXPANSIONS: Record<string, string[]> = {
  javascript: [
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "fullstack",
    "full-stack",
    "node",
    "react",
  ],
  typescript: [
    "frontend",
    "front-end",
    "backend",
    "back-end",
    "fullstack",
    "node",
    "react",
  ],
  react: ["frontend", "front-end", "javascript", "typescript"],
  "react.js": ["frontend", "front-end", "javascript"],
  reactjs: ["frontend", "front-end", "javascript"],
  vue: ["frontend", "front-end", "javascript"],
  "vue.js": ["frontend", "front-end", "javascript"],
  angular: ["frontend", "front-end", "typescript", "javascript"],
  "node.js": ["backend", "back-end", "javascript", "typescript"],
  nodejs: ["backend", "back-end", "javascript"],
  nestjs: ["backend", "back-end", "typescript", "node"],
  "next.js": ["frontend", "react", "typescript"],
  nextjs: ["frontend", "react", "typescript"],
  python: ["backend", "back-end", "django", "flask"],
  java: ["backend", "back-end", "spring"],
  php: ["backend", "back-end", "laravel"],
};

/** Facets preferred when ranking results for a skill query */
const SKILL_PREFER_FACETS: Record<
  string,
  { roleFamilies: string[]; skills: string[] }
> = {
  javascript: { roleFamilies: ["software_dev"], skills: ["javascript"] },
  typescript: {
    roleFamilies: ["software_dev"],
    skills: ["typescript", "javascript"],
  },
  react: { roleFamilies: ["software_dev"], skills: ["react", "frontend"] },
  "react.js": { roleFamilies: ["software_dev"], skills: ["react", "frontend"] },
  reactjs: { roleFamilies: ["software_dev"], skills: ["react", "frontend"] },
  vue: { roleFamilies: ["software_dev"], skills: ["vue", "frontend"] },
  "vue.js": { roleFamilies: ["software_dev"], skills: ["vue", "frontend"] },
  angular: { roleFamilies: ["software_dev"], skills: ["angular", "frontend"] },
  "node.js": { roleFamilies: ["software_dev"], skills: ["node", "backend"] },
  nodejs: { roleFamilies: ["software_dev"], skills: ["node", "backend"] },
  nestjs: { roleFamilies: ["software_dev"], skills: ["backend", "typescript"] },
  "next.js": { roleFamilies: ["software_dev"], skills: ["frontend", "react"] },
  nextjs: { roleFamilies: ["software_dev"], skills: ["frontend", "react"] },
  python: { roleFamilies: ["software_dev"], skills: ["python"] },
  java: { roleFamilies: ["software_dev"], skills: ["java"] },
  php: { roleFamilies: ["software_dev"], skills: ["php"] },
  golang: { roleFamilies: ["software_dev"], skills: ["golang"] },
  docker: { roleFamilies: ["software_dev"], skills: ["docker"] },
  kubernetes: { roleFamilies: ["software_dev"], skills: ["kubernetes"] },
  k8s: { roleFamilies: ["software_dev"], skills: ["kubernetes"] },
  devops: { roleFamilies: ["software_dev"], skills: ["devops"] },
};

function normalizeSkill(text: string): string {
  return text.trim().toLowerCase().replace(/\s+/g, " ");
}

function canonicalSkill(token: string): string | null {
  const n = normalizeSkill(token);
  if (SKILL_TYPOS[n]) return SKILL_TYPOS[n];
  if (SKILL_SET.has(n)) return n;
  return null;
}

/** True when the query is (or clearly centers on) a skill/tool keyword. */
export function isSkillKeywordQuery(rawQuery: string): boolean {
  const n = normalizeSkill(rawQuery);
  if (!n) return false;
  if (canonicalSkill(n)) return true;

  const tokens = n.split(" ");
  if (tokens.some((t) => canonicalSkill(t))) return true;

  return false;
}

export type SkillSearchPlan = {
  q: string;
  qAlternates?: string[];
  preferRoleFamilies?: string[];
  preferSkills?: string[];
};

export function skillSearchFromQuery(rawQuery: string): SkillSearchPlan {
  const n = normalizeSkill(rawQuery);
  const direct = canonicalSkill(n);
  if (direct) {
    return buildSkillPlan(direct, []);
  }

  const tokens = n.split(" ");
  const skillToken = tokens.find((t) => canonicalSkill(t));
  const skill = skillToken ? canonicalSkill(skillToken) : null;
  if (skill) {
    const extra = tokens.filter(
      (t) =>
        t !== skillToken &&
        t.length >= 2 &&
        !/^(job|jobs|developer|დეველოპერი|ვაკანსია|სამუშაო)$/i.test(t),
    );
    return buildSkillPlan(skill, extra);
  }

  return { q: rawQuery.trim() };
}

function buildSkillPlan(skill: string, extraTokens: string[]): SkillSearchPlan {
  const alts = [
    ...(SKILL_ALTERNATES[skill] || []),
    ...(SKILL_ROLE_EXPANSIONS[skill] || []),
    ...extraTokens,
  ];
  const unique = [...new Set(alts.map((s) => s.trim()).filter(Boolean))]
    .filter((s) => s.toLowerCase() !== skill.toLowerCase())
    .slice(0, 8);
  const prefer = SKILL_PREFER_FACETS[skill];
  return {
    q: skill,
    qAlternates: unique.length ? unique : undefined,
    preferRoleFamilies: prefer?.roleFamilies,
    preferSkills: prefer?.skills,
  };
}
