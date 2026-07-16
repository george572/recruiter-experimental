import type { Job, Level } from "@/lib/jobs"

export const SAMUSHAO_CATEGORIES = [
  "HR",
  "Web/Digital/Design",
  "ადმინისტრატორი",
  "აზარტული",
  "ბუღალტერია",
  "განათლება",
  "გაყიდვები",
  "დასუფთავება",
  "დაცვა, უსაფრთხოება",
  "დიასახლისი",
  "დისტრიბუცია",
  "ექთანი",
  "ექიმი",
  "ინჟინერია",
  "ინფორმაციული ტექნოლოგიები",
  "იურიდიული",
  "ლოჯისტიკა",
  "მარკეტინგი",
  "მენეჯმენტი",
  "მზარეული",
  "მზარეული, მცხობელი, დამხმარე",
  "მიმტანი",
  "მკერავი",
  "მოლარე-კონსულტანტი",
  "მომხმარებელთან ურთიერთობები",
  "მუშა, მტვირთავი",
  "მძღოლი",
  "რემონტი, მშენებლობა",
  "საბანკო-საფინანსო",
  "სამედიცინო",
  "საოფისე",
  "სასტუმრო, რესტორანი, კაფე, HoReCa",
  "საცალო ვაჭრობა",
  "საწყობი და წარმოება",
  "სოფლის მეურნეობა",
  "სხვა",
  "ტურიზმი",
  "უსაფრთხოება",
  "ფაბრიკა, წარმოება",
  "ფარმაცია",
  "ცხოველების მოვლა",
  "ძიძა, მომვლელი, დამხმარე",
  "ხელოსანი, შეკეთება, მონტაჟი",
] as const

export const SAMUSHAO_EXPERIENCE = [
  "სტაჟირება",
  "0-1 წელი",
  "1-2 წელი",
  "3-5 წელი",
  "5+ წელი",
] as const

export const SAMUSHAO_SCHEDULES = ["სრული განაკვეთი", "ნახევარი განაკვეთი"] as const

export const SAMUSHAO_WORK_MODES = ["ადგილზე", "დისტანციური"] as const

export const SAMUSHAO_CITIES = [
  "თბილისი",
  "ქუთაისი",
  "ბათუმი",
  "ზუგდიდი",
  "გორი",
  "რუსთავი",
  "მცხეთა",
  "თელავი",
  "მესტია",
  "ფოთი",
  "ჭიათურა",
  "ზესტაფონი",
  "მარნეული",
] as const

export const SALARY_MIN = 0
export const SALARY_MAX = 10000

export type SamushaoCategory = (typeof SAMUSHAO_CATEGORIES)[number]
export type SamushaoExperience = (typeof SAMUSHAO_EXPERIENCE)[number]
export type SamushaoSchedule = (typeof SAMUSHAO_SCHEDULES)[number]
export type SamushaoWorkMode = (typeof SAMUSHAO_WORK_MODES)[number]
export type SamushaoCity = (typeof SAMUSHAO_CITIES)[number]

export interface SamushaoFilters {
  categories: SamushaoCategory[]
  experience: SamushaoExperience[]
  schedules: SamushaoSchedule[]
  workModes: SamushaoWorkMode[]
  cities: SamushaoCity[]
  salaryMin: number
  salaryMax: number
}

export const DEFAULT_SAMUSHAO_FILTERS: SamushaoFilters = {
  categories: [],
  experience: [],
  schedules: [],
  workModes: [],
  cities: [],
  salaryMin: SALARY_MIN,
  salaryMax: SALARY_MAX,
}

export function countActiveSamushaoFilters(filters: SamushaoFilters): number {
  let count = 0
  count += filters.categories.length
  count += filters.experience.length
  count += filters.schedules.length
  count += filters.workModes.length
  count += filters.cities.length
  if (filters.salaryMin > SALARY_MIN) count += 1
  if (filters.salaryMax < SALARY_MAX) count += 1
  return count
}

const CATEGORY_FROM_ENGLISH: Record<string, SamushaoCategory> = {
  Engineering: "ინფორმაციული ტექნოლოგიები",
  Design: "Web/Digital/Design",
  Product: "მენეჯმენტი",
  Marketing: "მარკეტინგი",
  Data: "ინფორმაციული ტექნოლოგიები",
  Sales: "გაყიდვები",
  Finance: "საბანკო-საფინანსო",
}

const EXPERIENCE_FROM_LEVEL: Record<Level, SamushaoExperience> = {
  Junior: "0-1 წელი",
  Mid: "1-2 წელი",
  Senior: "3-5 წელი",
  Lead: "5+ წელი",
}

export function jobCategory(job: Job): SamushaoCategory {
  if ((SAMUSHAO_CATEGORIES as readonly string[]).includes(job.category)) {
    return job.category as SamushaoCategory
  }
  return CATEGORY_FROM_ENGLISH[job.category] ?? "სხვა"
}

export function jobExperience(job: Job): SamushaoExperience {
  if (job.type === "Internship") return "სტაჟირება"
  return EXPERIENCE_FROM_LEVEL[job.level]
}

export function jobSchedule(job: Job): SamushaoSchedule {
  if (job.type === "Part-time" || job.type === "Internship") return "ნახევარი განაკვეთი"
  return "სრული განაკვეთი"
}

export function jobWorkMode(job: Job): SamushaoWorkMode {
  return job.workplace === "Remote" ? "დისტანციური" : "ადგილზე"
}

export function jobCity(job: Job): string {
  const first = job.location.split(",")[0]?.trim() ?? job.location
  return first
}

export function matchesSamushaoFilters(job: Job, filters: SamushaoFilters): boolean {
  if (filters.categories.length > 0 && !filters.categories.includes(jobCategory(job))) {
    return false
  }
  if (filters.experience.length > 0 && !filters.experience.includes(jobExperience(job))) {
    return false
  }
  if (filters.schedules.length > 0 && !filters.schedules.includes(jobSchedule(job))) {
    return false
  }
  if (filters.workModes.length > 0 && !filters.workModes.includes(jobWorkMode(job))) {
    return false
  }
  if (filters.cities.length > 0) {
    const city = jobCity(job)
    if (!(filters.cities as readonly string[]).includes(city)) return false
  }
  if (job.salaryMax < filters.salaryMin || job.salaryMin > filters.salaryMax) {
    return false
  }
  return true
}

export function toggleListItem<T extends string>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value]
}
