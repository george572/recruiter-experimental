export type JobResult = {
  id: string;
  title: string;
  company: string;
  city: string;
  description: string;
  logoUrl: string;
  sourceName: string;
  url: string;
  /** Display-ready salary, e.g. "1,500 – 2,000 ₾" or "შეთანხმებით" */
  salary: string;
  /** Display-ready upload date, e.g. "24 ივლ. 2026" */
  uploadedAt: string;
  /** Display-ready source-site application deadline (empty if unknown) */
  expiresAt: string;
};

export type SmartFiltersPayload = {
  q: string;
  qAlternates?: string[];
  /** Separate role queries — results interleaved round-robin */
  qBranches?: string[];
  categoryId?: number;
  categoryName?: string;
  relatedCategoryId?: number;
  relatedCategoryName?: string;
  city?: string;
  salaryMin?: number;
  salaryMax?: number;
  hasSalary?: boolean;
  workingMode?: "remote" | "onsite";
  experience?: string[];
  employmentType?: string;
  uploadedSince?: "today";
  order?: "newest";
  preferRoleFamilies?: string[];
  preferSkills?: string[];
  preferPayCadence?: Array<"daily" | "monthly" | "hourly" | "unknown">;
  intentId?: string;
};

export type SearchResponse = {
  query: string;
  interpretation: string;
  fromGemini: boolean;
  filters: SmartFiltersPayload;
  results: JobResult[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
  nextOffset: number | null;
};
