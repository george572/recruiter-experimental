export interface Filters {
  query: string
  categories: string[]
  types: string[]
  workplaces: string[]
  levels: string[]
  minSalary: number
}

export const DEFAULT_FILTERS: Filters = {
  query: "",
  categories: [],
  types: [],
  workplaces: [],
  levels: [],
  minSalary: 0,
}

export function hasActiveFilters(filters: Filters): boolean {
  return (
    filters.query.trim() !== "" ||
    filters.categories.length > 0 ||
    filters.types.length > 0 ||
    filters.workplaces.length > 0 ||
    filters.levels.length > 0 ||
    filters.minSalary > 0
  )
}
