/**
 * Hidden job differentiators inferred from title + description.
 * Used for relevance ranking; not shown in the UI.
 */

export type PayCadence = "daily" | "monthly" | "hourly" | "unknown";

export type JobFacets = {
  role_family: string[];
  skills: string[];
  pay_cadence: PayCadence;
  seniority: string[];
  work_mode: "remote" | "onsite" | "hybrid" | "unknown";
};

function haystack(title: string, description: string): string {
  return `${title || ""}\n${description || ""}`.toLowerCase();
}

function pushUnique(list: string[], value: string) {
  if (!list.includes(value)) list.push(value);
}

/** Infer facets from free text (rule-based, fast, bilingual). */
export function inferJobFacets(
  title: string,
  description = "",
): JobFacets {
  const text = haystack(title, description);
  const titleOnly = (title || "").toLowerCase();
  const facets: JobFacets = {
    role_family: [],
    skills: [],
    pay_cadence: "unknown",
    seniority: [],
    work_mode: "unknown",
  };

  // --- pay cadence / day labor ---
  // Prefer title signals; avoid matching generic "ყოველდღიური" marketing copy.
  const dailyTitle =
    /დღიურ|დღის\s*მუშ/.test(titleOnly) ||
    /\b(day\s*labou?r|daily\s*(pay|wage|job|rate)|per\s*day)\b/i.test(titleOnly);
  const dailyBody =
    /დღიურ(?:ი|ად|ის)?\s*(?:მუშ|ანაზღაურ|ხელფას|გადახდ)/.test(text) ||
    /ანაზღაურება\s*დღიურ/.test(text) ||
    /\b(day\s*labou?r|daily\s*(pay|wage|rate)|paid\s*daily|per\s*day)\b/i.test(
      text,
    );
  if (dailyTitle || dailyBody) {
    pushUnique(facets.role_family, "day_labor");
    facets.pay_cadence = "daily";
  } else if (/საათობრივ|hourly|per\s*hour/i.test(text)) {
    facets.pay_cadence = "hourly";
  } else if (/ყოველთვიურ|monthly|თვეში/i.test(text)) {
    facets.pay_cadence = "monthly";
  }

  // --- software / web ---
  const isSoftwareTitle =
    /დეველოპერ|developer|engineer|ინჟინერ|პროგრამისტ|programmer|software|fullstack|full-?stack|frontend|front-?end|backend|back-?end|ვებ\s*დეველოპ/.test(
      titleOnly,
    );
  const hasWebStack =
    /\b(javascript|typescript|\bjs\b|\bts\b|react|vue|angular|node\.?js|nestjs|next\.?js|express|graphql)\b/i.test(
      text,
    ) ||
    /ჯავასკრიპტ|ტაიპსკრიპტ|რეაქტ/.test(text);

  if (isSoftwareTitle || hasWebStack) {
    pushUnique(facets.role_family, "software_dev");
  }

  if (/frontend|front-?end|ფრონტ/.test(text) || /\b(react|vue|angular|next\.?js)\b/i.test(text)) {
    pushUnique(facets.skills, "frontend");
    pushUnique(facets.role_family, "software_dev");
  }
  if (
    /backend|back-?end|ბექ/.test(text) ||
    /\b(node\.?js|nodejs|nestjs|express|django|flask|laravel|spring)\b/i.test(text)
  ) {
    pushUnique(facets.skills, "backend");
    pushUnique(facets.role_family, "software_dev");
  }
  if (/fullstack|full-?stack|ფულსტეკ/.test(text)) {
    pushUnique(facets.skills, "frontend");
    pushUnique(facets.skills, "backend");
    pushUnique(facets.role_family, "software_dev");
  }

  const skillPatterns: Array<[RegExp, string]> = [
    [/\bjavascript\b|\bjs\b|ჯავასკრიპტ/i, "javascript"],
    [/\btypescript\b|\bts\b|ტაიპსკრიპტ/i, "typescript"],
    [/\breact(\.js|js)?\b/i, "react"],
    [/\bvue(\.js|js)?\b/i, "vue"],
    [/\bangular\b/i, "angular"],
    [/\bnode(\.js|js)?\b/i, "node"],
    [/\bpython\b/i, "python"],
    [/\bjava\b(?!script)/i, "java"],
    [/\bphp\b/i, "php"],
    [/\bdocker\b/i, "docker"],
    [/\bkubernetes\b|\bk8s\b/i, "kubernetes"],
  ];
  for (const [re, skill] of skillPatterns) {
    if (re.test(text)) pushUnique(facets.skills, skill);
  }

  // Teachers / schools mentioning a stack in curriculum — not software_dev roles
  if (
    /მასწავლებ|teacher|tutor|რეპეტიტორ|ლექტორ|instructor|კურსი|course|სასწავლო|ტრენინგ|training\s*program/.test(
      titleOnly,
    ) &&
    !isSoftwareTitle
  ) {
    facets.role_family = facets.role_family.filter((f) => f !== "software_dev");
    pushUnique(facets.role_family, "education");
  }

  // --- other families (light) ---
  if (/გაყიდვ|sales|მოლარე|კონსულტანტ/.test(titleOnly)) {
    pushUnique(facets.role_family, "sales");
  }
  if (/ოფის|admin|ადმინისტრატ|ასისტენტ/.test(titleOnly)) {
    pushUnique(facets.role_family, "office");
  }
  if (/მზარეულ|მიმტან|ბარმენ|horeca|რესტორან/.test(titleOnly)) {
    pushUnique(facets.role_family, "horeca");
  }
  if (/კურიერ|courier|მძღოლ|driver/.test(titleOnly)) {
    pushUnique(facets.role_family, "logistics");
  }

  // --- work mode ---
  if (/remote|დისტანციურ|from\s*home|სახლიდან/i.test(text)) {
    facets.work_mode = /hybrid|ჰიბრიდ/i.test(text) ? "hybrid" : "remote";
  } else if (/ონსაიტ|on-?site|ოფისში|office/i.test(text)) {
    facets.work_mode = "onsite";
  }

  // --- seniority ---
  if (/junior|ჯუნიორ|intern|სტაჟირ|trainee/i.test(text)) {
    pushUnique(facets.seniority, "junior");
  }
  if (/middle|მიდლ/i.test(text)) pushUnique(facets.seniority, "middle");
  if (/senior|სენიორ|lead|უფროს/i.test(text)) {
    pushUnique(facets.seniority, "senior");
  }

  return facets;
}

/** Score how well job facets align with preferred intent facets. */
export function facetAlignmentScore(
  facets: JobFacets,
  prefer: {
    roleFamilies?: string[];
    skills?: string[];
    payCadence?: PayCadence[];
  },
): number {
  let score = 0;
  const roles = prefer.roleFamilies || [];
  const skills = prefer.skills || [];
  const cadence = prefer.payCadence || [];

  for (const role of roles) {
    if (facets.role_family.includes(role)) score += 2500;
  }

  // Strong penalty when intent wants software_dev but job is education / non-dev
  if (
    roles.includes("software_dev") &&
    !facets.role_family.includes("software_dev")
  ) {
    score -= 1200;
    if (facets.role_family.includes("education")) score -= 800;
  }

  if (roles.includes("day_labor")) {
    if (facets.role_family.includes("day_labor")) score += 800;
    if (facets.pay_cadence === "daily") score += 600;
    if (
      !facets.role_family.includes("day_labor") &&
      facets.pay_cadence !== "daily"
    ) {
      score -= 1500;
    }
  }

  for (const skill of skills) {
    if (facets.skills.includes(skill)) score += 900;
  }

  for (const c of cadence) {
    if (facets.pay_cadence === c) score += 700;
  }

  return score;
}
