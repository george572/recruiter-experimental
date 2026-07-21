/**
 * URL taxonomy for programmatic SEO landing pages.
 *
 * Slugs mirror the proven Samushao.ge scheme (Latin transliteration of the
 * Georgian category / city names) so the pages target the same search intent.
 * `name` MUST match the Georgian category name used by the jobs API and the
 * board filters (see SAMUSHAO_CATEGORIES / SAMUSHAO_CITIES).
 */

export type CategoryTaxon = {
  /** URL segment, e.g. "informatsiuli-teknologiebi". */
  slug: string
  /** Canonical Georgian category name (matches the API + board filters). */
  name: string
}

export type CityTaxon = {
  /** URL segment, e.g. "tbilisi". */
  slug: string
  /** Canonical Georgian city name (matches the API + board filters). */
  name: string
  /** Georgian locative form ("in <city>"), e.g. "თბილისში". */
  locative: string
}

export const CATEGORY_TAXONOMY: CategoryTaxon[] = [
  { slug: "hr", name: "HR" },
  { slug: "web-digital-design", name: "Web/Digital/Design" },
  { slug: "administratori", name: "ადმინისტრატორი" },
  { slug: "azartuli", name: "აზარტული" },
  { slug: "bughalteria", name: "ბუღალტერია" },
  { slug: "ganatleba", name: "განათლება" },
  { slug: "gaqidvebi", name: "გაყიდვები" },
  { slug: "dasuftaveba", name: "დასუფთავება" },
  { slug: "datsva-usafrtkhoeba", name: "დაცვა, უსაფრთხოება" },
  { slug: "diasakhlisi", name: "დიასახლისი" },
  { slug: "distributsia", name: "დისტრიბუცია" },
  { slug: "ektani", name: "ექთანი" },
  { slug: "ekimi", name: "ექიმი" },
  { slug: "inzhineria", name: "ინჟინერია" },
  { slug: "informatsiuli-teknologiebi", name: "ინფორმაციული ტექნოლოგიები" },
  { slug: "iuridiuli", name: "იურიდიული" },
  { slug: "lojistika", name: "ლოჯისტიკა" },
  { slug: "marketingi", name: "მარკეტინგი" },
  { slug: "menejmenti", name: "მენეჯმენტი" },
  { slug: "mzareuli", name: "მზარეული" },
  { slug: "mzareuli-mtskhobeli-damkhmare", name: "მზარეული, მცხობელი, დამხმარე" },
  { slug: "mimtani", name: "მიმტანი" },
  { slug: "mkeravi", name: "მკერავი" },
  { slug: "molare-konsultanti", name: "მოლარე-კონსულტანტი" },
  { slug: "momkhmarebeltan-urtiertobebi", name: "მომხმარებელთან ურთიერთობები" },
  { slug: "musha-mtvirtavi", name: "მუშა, მტვირთავი" },
  { slug: "mdzgholi", name: "მძღოლი" },
  { slug: "remonti-mshenebloba", name: "რემონტი, მშენებლობა" },
  { slug: "sabanko-safinanso", name: "საბანკო-საფინანსო" },
  { slug: "sameditsino", name: "სამედიცინო" },
  { slug: "saofise", name: "საოფისე" },
  { slug: "sastumro-restorani-kafe-horeca", name: "სასტუმრო, რესტორანი, კაფე, HoReCa" },
  { slug: "satsalo-vachroba", name: "საცალო ვაჭრობა" },
  { slug: "satsqobi-da-tsarmoeba", name: "საწყობი და წარმოება" },
  { slug: "soflis-meurneoba", name: "სოფლის მეურნეობა" },
  { slug: "skhva", name: "სხვა" },
  { slug: "turizmi", name: "ტურიზმი" },
  { slug: "usafrtkhoeba", name: "უსაფრთხოება" },
  { slug: "fabrika-tsarmoeba", name: "ფაბრიკა, წარმოება" },
  { slug: "farmatsia", name: "ფარმაცია" },
  { slug: "tskhovelebis-movla", name: "ცხოველების მოვლა" },
  { slug: "dzidza-momvleli-damkhmare", name: "ძიძა, მომვლელი, დამხმარე" },
  { slug: "khelosani-sheketeba-montazhi", name: "ხელოსანი, შეკეთება, მონტაჟი" },
]

export const CITY_TAXONOMY: CityTaxon[] = [
  { slug: "tbilisi", name: "თბილისი", locative: "თბილისში" },
  { slug: "kutaisi", name: "ქუთაისი", locative: "ქუთაისში" },
  { slug: "batumi", name: "ბათუმი", locative: "ბათუმში" },
  { slug: "zugdidi", name: "ზუგდიდი", locative: "ზუგდიდში" },
  { slug: "gori", name: "გორი", locative: "გორში" },
  { slug: "rustavi", name: "რუსთავი", locative: "რუსთავში" },
  { slug: "mtskheta", name: "მცხეთა", locative: "მცხეთაში" },
  { slug: "telavi", name: "თელავი", locative: "თელავში" },
  { slug: "mestia", name: "მესტია", locative: "მესტიაში" },
  { slug: "foti", name: "ფოთი", locative: "ფოთში" },
  { slug: "chiatura", name: "ჭიათურა", locative: "ჭიათურაში" },
  { slug: "zestafoni", name: "ზესტაფონი", locative: "ზესტაფონში" },
  { slug: "marneuli", name: "მარნეული", locative: "მარნეულში" },
]

const CATEGORY_BY_SLUG = new Map(CATEGORY_TAXONOMY.map((c) => [c.slug, c]))
const CITY_BY_SLUG = new Map(CITY_TAXONOMY.map((c) => [c.slug, c]))

export function getCategoryBySlug(slug: string): CategoryTaxon | undefined {
  return CATEGORY_BY_SLUG.get(slug.toLowerCase())
}

export function getCityBySlug(slug: string): CityTaxon | undefined {
  return CITY_BY_SLUG.get(slug.toLowerCase())
}

/** Canonical path for a category landing page. */
export function categoryPath(categorySlug: string): string {
  return `/vakansiebi/${categorySlug}`
}

/** Canonical path for a category × city landing page. */
export function cityPath(categorySlug: string, citySlug: string): string {
  return `/vakansiebi/${categorySlug}/${citySlug}`
}
