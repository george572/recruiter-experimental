export interface WorkExperience {
  company: string
  role: string
  period: string
  description: string
}

export interface Education {
  institution: string
  degree: string
  period: string
}

export interface Certification {
  name: string
  issuer: string
  year: string
}

export interface Language {
  name: string
  level: string
}

export interface Candidate {
  id: string
  userUid: string
  firstName: string
  lastName: string
  lastNameInitial: string
  phone: string
  email: string
  city: string
  district: string
  address: string
  lastVisit: string
  preferredSalary: string
  fitDescription: string
  workExperience: WorkExperience[]
  education: Education[]
  languages: Language[]
  certifications: Certification[]
  additionalInfo: string
}

const FIRST_NAMES = [
  "გიორგი",
  "ნინო",
  "დავით",
  "მარიამ",
  "ლუკა",
  "ანა",
  "ირაკლი",
  "თამარ",
  "ნიკა",
  "სალომე",
  "გიგა",
  "ელენე",
  "ლევან",
  "თეა",
  "სანდრო",
]

const LAST_NAMES = [
  "აბაშიძე",
  "ბერიძე",
  "გელაშვილი",
  "დვალიშვილი",
  "კაპანაძე",
  "მაისურაძე",
  "ნადირაძე",
  "პაპავა",
  "სილაგაძე",
  "შავლიძე",
  "ცინცაძე",
  "ხარაძიშვილი",
]

const FIT_DESCRIPTIONS = [
  "ძალიან მაღალი შესაბამისობა — 5+ წლის გამოცდილება ზუსტად შენს კრიტერიუმებზეა ორიენტირებული.",
  "კარგი შესაბამისობა — ძირითადი სკილები ემთხვევა, სჭირდება მცირე onboarding.",
  "საშუალო-მაღალი შესაბამისობა — ძლიერი ტექნიკური ბაზა და რელევანტური პროექტები.",
  "ძალიან რელევანტური პროფილი — ბოლო როლიც თითქმის იდენტური სტეკით იყო.",
  "კარგი კულტურული და ტექნიკური fit — სწრაფად ჩაერთვება გუნდში.",
  "მაღალი შესაბამისობა — ხელფასის მოლოდინი და გამოცდილება თანხვედრილია.",
]

const VISIT_LABELS = ["დღეს", "გუშინ", "2 დღის წინ", "3 დღის წინ", "კვირის წინ"]

const CITIES = ["თბილისი", "ბათუმი", "ქუთაისი", "რუსთავი"]
const DISTRICTS = ["ვაკე", "საბურთალო", "ისანი", "გლდანი", "დიღომი", "ჩუღურეთი"]

const COMPANIES = ["TBC", "Bank of Georgia", "Wolt", "Bolt", "Expo Georgia", "Adjarabet"]
const ROLES = ["ფრონტენდ ინჟინერი", "ბექენდ დეველოპერი", "პროდუქტის მენეჯერი", "UX დიზაინერი", "დატა ანალიტიკოსი"]
const UNIVERSITIES = ["თბილისის სახელმწიფო უნივერსიტეტი", "კავკასიის უნივერსიტეტი", "GTU", "ილიას სახელმწიფო უნივერსიტეტი"]
const DEGREES = ["ბაკალავრი, ინფორმატიკა", "მაგისტრი, ბიზნესის ადმინისტრირება", "ბაკალავრი, ეკონომიკა", "მაგისტრი, კომპიუტერული მეცნიერებები"]

function buildWorkExperience(seed: number): WorkExperience[] {
  return [
    {
      company: COMPANIES[seed % COMPANIES.length],
      role: ROLES[seed % ROLES.length],
      period: "2022 — დღემდე",
      description: "პროდუქტის მასშტაბირება, გუნდთან თანამშრომლობა და მაღალი ხარისხის მიწოდება.",
    },
    {
      company: COMPANIES[(seed + 2) % COMPANIES.length],
      role: ROLES[(seed + 1) % ROLES.length],
      period: "2019 — 2022",
      description: "ძირითადი ფუნქციონალის დაგეგმვა, კოდის რევიუ და მენტორობა.",
    },
  ]
}

function buildEducation(seed: number): Education[] {
  return [
    {
      institution: UNIVERSITIES[seed % UNIVERSITIES.length],
      degree: DEGREES[seed % DEGREES.length],
      period: "2015 — 2019",
    },
  ]
}

function buildCertifications(seed: number): Certification[] {
  return [
    { name: "AWS Cloud Practitioner", issuer: "Amazon", year: "2023" },
    { name: "Google UX Design", issuer: "Google", year: String(2021 + (seed % 3)) },
  ]
}

function buildLanguages(seed: number): Language[] {
  const sets: Language[][] = [
    [
      { name: "ქართული", level: "მოგენი" },
      { name: "ინგლისური", level: "თავისუფლად" },
      { name: "რუსული", level: "საშუალო" },
    ],
    [
      { name: "ქართული", level: "მოგენი" },
      { name: "ინგლისური", level: "თავისუფლად" },
      { name: "გერმანული", level: "საწყისი" },
    ],
    [
      { name: "ქართული", level: "მოგენი" },
      { name: "ინგლისური", level: "საშუალო" },
      { name: "რუსული", level: "თავისუფლად" },
    ],
    [
      { name: "ქართული", level: "მოგენი" },
      { name: "ინგლისური", level: "თავისუფლად" },
      { name: "ფრანგული", level: "საშუალო" },
    ],
  ]

  return sets[seed % sets.length]
}

export function generateCandidates(count: number, offset = 0): Candidate[] {
  return Array.from({ length: count }, (_, index) => {
    const seed = offset + index
    const salaryBase = 1800 + (seed % 7) * 350
    const firstName = FIRST_NAMES[seed % FIRST_NAMES.length]
    const lastName = LAST_NAMES[seed % LAST_NAMES.length]

    return {
      id: `candidate-${seed}`,
      userUid: `firebase-uid-${seed}`,
      firstName,
      lastName,
      lastNameInitial: lastName.charAt(0),
      phone: `+995 5${(10 + (seed % 80)).toString().padStart(2, "0")} ${(20 + (seed % 70)).toString().padStart(2, "0")} ${(10 + (seed % 80)).toString().padStart(2, "0")} ${(10 + (seed % 90)).toString().padStart(2, "0")}`,
      email: `${firstName.toLowerCase()}.${lastName.charAt(0).toLowerCase()}@mail.ge`,
      city: CITIES[seed % CITIES.length],
      district: DISTRICTS[seed % DISTRICTS.length],
      address: `№${12 + (seed % 40)}, ქუჩა ${seed + 1}`,
      lastVisit: VISIT_LABELS[seed % VISIT_LABELS.length],
      preferredSalary: `₾${salaryBase.toLocaleString("en-US")} – ₾${(salaryBase + 600).toLocaleString("en-US")}`,
      fitDescription: FIT_DESCRIPTIONS[seed % FIT_DESCRIPTIONS.length],
      workExperience: buildWorkExperience(seed),
      education: buildEducation(seed),
      languages: buildLanguages(seed),
      certifications: buildCertifications(seed),
      additionalInfo:
        "თავისუფლად ფლობს ინგლისურს, გავლილი აქვს სამუშაო გასაუბრებები საერთაშორისო კომპანიებში და მზადაა ჰიბრიდული ფორმატისთვის.",
    }
  })
}
