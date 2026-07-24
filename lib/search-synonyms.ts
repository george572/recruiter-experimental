/**
 * EN ↔ KA search expansions so Latin queries hit Georgian titles/bodies
 * (and the reverse), matching how candidates actually type vs how jobs are written.
 *
 * Also strips common English suffixes so "designer" matches "designated" /
 * "designing" via the shared stem "design".
 */

const SYNONYM_GROUPS: string[][] = [
  ["designer", "დიზაინერი"],
  ["developer", "დეველოპერი", "programmer", "პროგრამისტი"],
  ["manager", "მენეჯერი"],
  ["accountant", "ბუღალტერი"],
  ["lawyer", "იურისტი", "attorney"],
  ["driver", "მძღოლი"],
  ["waiter", "მიმტანი", "ოფიციანტი"],
  ["cook", "chef", "მზარეული"],
  ["nurse", "ექთანი"],
  ["doctor", "ექიმი"],
  ["teacher", "მასწავლებელი"],
  ["engineer", "ინჟინერი"],
  ["analyst", "ანალიტიკოსი"],
  ["assistant", "ასისტენტი"],
  ["consultant", "კონსულტანტი"],
  ["operator", "ოპერატორი"],
  ["administrator", "ადმინისტრატორი"],
  ["sales", "გაყიდვები"],
  ["marketing", "მარკეტინგი"],
  ["receptionist", "რეცეფციონისტი"],
  ["cleaner", "დამლაგებელი", "დიასახლისი"],
  ["security", "დაცვა", "დაცვის"],
  ["internship", "სტაჟირება", "სტაჟიორი", "intern"],
]

/** Longest-first so "ated" wins over "ed", "ers" over "er", etc. */
const ENGLISH_SUFFIXES = [
  "ational",
  "ation",
  "ments",
  "ment",
  "nesses",
  "ness",
  "ables",
  "able",
  "ibles",
  "ible",
  "ances",
  "ance",
  "ences",
  "ence",
  "ators",
  "ator",
  "ated",
  "ates",
  "ate",
  "ings",
  "ing",
  "ied",
  "ies",
  "ily",
  "ally",
  "ers",
  "er",
  "eds",
  "ed",
  "es",
  "ly",
  "s",
]

function normalizeToken(s: string) {
  return s.trim().toLowerCase()
}

function isLatinWord(s: string) {
  return /^[a-z][a-z'-]*$/i.test(s.trim())
}

/**
 * Strip one English suffix → stem used as substring match.
 * designer → design (matches designated, designing, …)
 */
export function englishStem(token: string): string | null {
  const w = normalizeToken(token).replace(/[^a-z]/g, "")
  if (w.length < 5 || !isLatinWord(w)) return null
  for (const suf of ENGLISH_SUFFIXES) {
    if (!w.endsWith(suf)) continue
    const stem = w.slice(0, -suf.length)
    if (stem.length >= 4) return stem
  }
  return null
}

/** Synonym strings for a single token (includes the token itself). */
function synonymsForToken(token: string): string[] {
  const key = normalizeToken(token)
  if (!key) return []
  for (const group of SYNONYM_GROUPS) {
    if (group.some((g) => normalizeToken(g) === key)) {
      return [...new Set(group)]
    }
  }
  return [token]
}

function expansionsForToken(token: string): string[] {
  const out = new Set<string>()
  for (const s of synonymsForToken(token)) out.add(s)

  const stem = englishStem(token)
  if (stem) {
    out.add(stem)
    // Stem may itself be a known EN↔KA headword.
    for (const s of synonymsForToken(stem)) out.add(s)
  }

  return [...out]
}

/**
 * Expand a user query into OR-terms for DB search.
 * "designer" → ["designer", "დიზაინერი", "design"]
 * "designated" → ["designated", "design", …]
 */
export function expandSearchTerms(q: string): string[] {
  const trimmed = q.trim()
  if (!trimmed) return []

  const terms = new Set<string>([trimmed])
  const tokens = trimmed.split(/\s+/).filter(Boolean)

  if (tokens.length === 1) {
    for (const s of expansionsForToken(tokens[0])) terms.add(s)
    return [...terms]
  }

  // Multi-word: expand each token into alternate phrases.
  for (let i = 0; i < tokens.length; i++) {
    const syns = expansionsForToken(tokens[i])
    if (syns.length <= 1) continue
    for (const syn of syns) {
      if (normalizeToken(syn) === normalizeToken(tokens[i])) continue
      const next = [...tokens]
      next[i] = syn
      terms.add(next.join(" "))
    }
  }

  return [...terms]
}
