export type JobType = "Full-time" | "Part-time" | "Contract" | "Internship"
export type Workplace = "Remote" | "Hybrid" | "On-site"
export type Level = "Junior" | "Mid" | "Senior" | "Lead"

export interface JobComment {
  id: string
  author: string
  profession: string
  avatar: string
  body: string
  postedDaysAgo: number
  relevant?: boolean
}

export interface Job {
  id: string
  title: string
  company: string
  logo: string
  location: string
  workplace: Workplace
  type: JobType
  level: Level
  category: string
  salaryMin: number
  salaryMax: number
  currency: string
  postedDaysAgo: number
  description: string
  tags: string[]
  applicants: number
  hrActive?: boolean
  comments?: JobComment[]
}

export const CATEGORIES = [
  "Engineering",
  "Design",
  "Product",
  "Marketing",
  "Data",
  "Sales",
  "Finance",
] as const

export const JOB_TYPES: JobType[] = ["Full-time", "Part-time", "Contract", "Internship"]
export const WORKPLACES: Workplace[] = ["Remote", "Hybrid", "On-site"]
export const LEVELS: Level[] = ["Junior", "Mid", "Senior", "Lead"]

export const JOBS: Job[] = [
  {
    id: "1",
    title: "სენიორ ფრონტენდ ინჟინერი",
    company: "ნორთვინდ ლაბსი",
    logo: "/logos/northwind.png",
    location: "თბილისი, საქართველო",
    workplace: "Hybrid",
    type: "Full-time",
    level: "Senior",
    category: "Engineering",
    salaryMin: 4500,
    salaryMax: 6500,
    currency: "$",
    postedDaysAgo: 2,
    description:
      "შექმნი სწრაფ, დახვეწილ ინტერფეისებს React-ით და TypeScript-ით. იმუშავებ მთავარ პროდუქტის ეკრანებზე დიზაინთან და პროდუქტის გუნდთან ერთად.",
    tags: ["React", "TypeScript", "Next.js", "Tailwind"],
    applicants: 34,
    hrActive: true,
    comments: [
      {
        id: "1-1",
        author: "დავით",
        profession: "ფრონტენდ ინჟინერი",
        avatar: "https://i.pravatar.cc/96?u=davit-k",
        body: "ვინმემ იცით ტექნიკური ეტაპი როგორია? მაინტერესებს live coding არის თუ უფრო არქიტექტურის და React გამოცდილების განხილვა.",
        postedDaysAgo: 1,
        relevant: true,
      },
      {
        id: "1-2",
        author: "ელენე",
        profession: "React დეველოპერი",
        avatar: "https://i.pravatar.cc/96?u=elene-k",
        body: "ჰიბრიდული რამდენად მოქნილია? კვირაში 1 დღე ოფისში ჩემთვის იდეალური იქნებოდა.",
        postedDaysAgo: 2,
      },
      {
        id: "1-3",
        author: "თეო",
        profession: "Full-stack დეველოპერი",
        avatar: "https://i.pravatar.cc/96?u=teo-k",
        body: "ხელფასი ბრუნდება net-ად თუ gross? და trial period რამდენი თვეა?",
        postedDaysAgo: 3,
      },
    ],
  },
  {
    id: "2",
    title: "პროდუქტის დიზაინერი",
    company: "ლუმენ სტუდიო",
    logo: "/logos/lumen.png",
    location: "დისტანციური, ევროპა",
    workplace: "Remote",
    type: "Full-time",
    level: "Mid",
    category: "Design",
    salaryMin: 3500,
    salaryMax: 5000,
    currency: "$",
    postedDaysAgo: 1,
    description:
      "შექმნი სრულ პროდუქტულ გამოცდილებას კვლევიდან დასრულებულ ინტერფეისამდე. იმუშავებ მცირე, გამოცდილ გუნდში, სადაც მნიშვნელოვანია ხარისხი და სიცხადე.",
    tags: ["Figma", "პროტოტიპირება", "დიზაინ-სისტემები"],
    applicants: 58,
    hrActive: true,
    comments: [
      {
        id: "2-1",
        author: "მარიამ",
        profession: "UI/UX დიზაინერი",
        avatar: "https://i.pravatar.cc/96?u=mariam-k",
        body: "პორტფოლიოში მხოლოდ ვიზუალური UI ქეისები მაქვს და კვლევა ნაკლებად ჩანს. ასეთ შემთხვევაში ღირს განაცხადის გაგზავნა?",
        postedDaysAgo: 1,
        relevant: true,
      },
    ],
  },
  {
    id: "3",
    title: "ბექენდ ინჟინერი",
    company: "კობალტ სისტემსი",
    logo: "/logos/cobalt.png",
    location: "თბილისი, საქართველო",
    workplace: "On-site",
    type: "Full-time",
    level: "Mid",
    category: "Engineering",
    salaryMin: 4000,
    salaryMax: 5800,
    currency: "$",
    postedDaysAgo: 4,
    description:
      "დააპროექტებ და გააფართოებ მდგრად სერვისებს Go-სა და PostgreSQL-ზე. მნიშვნელოვანი იქნება საიმედოობა, დაკვირვებადობა და სუფთა API-ები.",
    tags: ["Go", "PostgreSQL", "Kubernetes", "gRPC"],
    applicants: 21,
    comments: [
      {
        id: "3-1",
        author: "გიორგი",
        profession: "ბექენდ ინჟინერი",
        avatar: "https://i.pravatar.cc/96?u=giorgi-k",
        body: "Go-ში 2 წელი მაქვს გამოცდილება, Kubernetes-ში კი მხოლოდ basic deploy-ები. ეს როლისთვის საკმარისი იქნება?",
        postedDaysAgo: 3,
        relevant: true,
      },
    ],
  },
  {
    id: "4",
    title: "ზრდის მარკეტინგის ლიდი",
    company: "ჰარბორ და კომპანია",
    logo: "/logos/harbor.png",
    location: "ბათუმი, საქართველო",
    workplace: "Hybrid",
    type: "Full-time",
    level: "Lead",
    category: "Marketing",
    salaryMin: 3800,
    salaryMax: 5500,
    currency: "$",
    postedDaysAgo: 6,
    description:
      "მართავ ზრდის სრულ funnel-ს ფასიანი არხების, lifecycle კამპანიებისა და კონტენტის მიმართულებით. ააწყობ მონაცემებზე დაფუძნებულ ზრდის სისტემას.",
    tags: ["SEO", "ფასიანი რეკლამა", "Lifecycle", "ანალიტიკა"],
    applicants: 12,
  },
  {
    id: "5",
    title: "მონაცემთა მეცნიერი",
    company: "მერიდიან AI",
    logo: "/logos/meridian.png",
    location: "დისტანციური, გლობალურად",
    workplace: "Remote",
    type: "Full-time",
    level: "Senior",
    category: "Data",
    salaryMin: 5000,
    salaryMax: 7500,
    currency: "$",
    postedDaysAgo: 3,
    description:
      "გადააქცევ რთულ მონაცემებს მოდელებად, რომლებიც ბიზნესს რეალურ შედეგს აძლევს. პროდუქტის გუნდთან ერთად ბოლომდე მიიყვან ML ფუნქციებს.",
    tags: ["Python", "PyTorch", "SQL", "MLOps"],
    applicants: 47,
  },
  {
    id: "6",
    title: "პროდუქტის მენეჯერი",
    company: "ნორთვინდ ლაბსი",
    logo: "/logos/northwind.png",
    location: "თბილისი, საქართველო",
    workplace: "Hybrid",
    type: "Full-time",
    level: "Senior",
    category: "Product",
    salaryMin: 4500,
    salaryMax: 6800,
    currency: "$",
    postedDaysAgo: 5,
    description:
      "განსაზღვრავ roadmap-ს და წარმართავ სხვადასხვა გუნდის მიწოდებას. მომხმარებლის საჭიროებებს გადააქცევ მკაფიო, შესრულებად გეგმად.",
    tags: ["Roadmap", "კვლევა", "ანალიტიკა"],
    applicants: 29,
    hrActive: true,
    comments: [
      {
        id: "6-1",
        author: "ნიკა",
        profession: "პროდუქტის მენეჯერი",
        avatar: "https://i.pravatar.cc/96?u=nika-k",
        body: "ხელფასის დიაპაზონი კარგია, მაგრამ მაინტერესებს decision-making რეალურად PM-ს აქვს თუ roadmap უკვე წინასწარ არის გადაწყვეტილი?",
        postedDaysAgo: 2,
        relevant: true,
      },
      {
        id: "6-2",
        author: "სოფო",
        profession: "პროდუქტის მენეჯერი",
        avatar: "https://i.pravatar.cc/96?u=sofo-k",
        body: "B2B SaaS გამოცდილება აუცილებელია? პროდუქტის მენეჯმენტი მაქვს fintech-ში, მაგრამ SaaS-ში არა.",
        postedDaysAgo: 4,
      },
      {
        id: "6-3",
        author: "ლაშა",
        profession: "Growth PM",
        avatar: "https://i.pravatar.cc/96?u=lasha-k",
        body: "ინტერვიუს პროცესი რამდენ ეტაპს მოიცავს? HR-ის შემდეგ პირდაპირ founder-თან ვხვდები?",
        postedDaysAgo: 5,
      },
    ],
  },
  {
    id: "7",
    title: "ჯუნიორ UI დეველოპერი",
    company: "ლუმენ სტუდიო",
    logo: "/logos/lumen.png",
    location: "თბილისი, საქართველო",
    workplace: "On-site",
    type: "Internship",
    level: "Junior",
    category: "Engineering",
    salaryMin: 1200,
    salaryMax: 1800,
    currency: "$",
    postedDaysAgo: 1,
    description:
      "დაიწყებ კარიერას რეალური პროდუქტის ინტერფეისებზე მუშაობით გამოცდილ ინჟინრებთან ერთად. ისწავლი თანამედროვე ხელსაწყოებს და საუკეთესო პრაქტიკებს.",
    tags: ["HTML", "CSS", "JavaScript", "React"],
    applicants: 73,
    hrActive: true,
    comments: [
      {
        id: "7-1",
        author: "ლუკა",
        profession: "Junior UI დეველოპერი",
        avatar: "https://i.pravatar.cc/96?u=luka-k",
        body: "სტაჟირებისთვის კომერციული გამოცდილება აუცილებელია? React პატარა პროექტებით ვიცი, მაგრამ გუნდში ჯერ არ მიმუშავია.",
        postedDaysAgo: 1,
        relevant: true,
      },
    ],
  },
  {
    id: "8",
    title: "გაყიდვების მენეჯერი",
    company: "ჰარბორ და კომპანია",
    logo: "/logos/harbor.png",
    location: "დისტანციური, ევროპა",
    workplace: "Remote",
    type: "Contract",
    level: "Mid",
    category: "Sales",
    salaryMin: 3000,
    salaryMax: 4500,
    currency: "$",
    postedDaysAgo: 8,
    description:
      "განავითარებ ახალ გაყიდვებს საშუალო ზომის კომპანიებთან. სრულად მართავ გაყიდვების ციკლს პირველი კონტაქტიდან დახურვამდე.",
    tags: ["B2B", "SaaS", "CRM"],
    applicants: 18,
  },
  {
    id: "9",
    title: "ფინანსური ანალიტიკოსი",
    company: "კობალტ სისტემსი",
    logo: "/logos/cobalt.png",
    location: "თბილისი, საქართველო",
    workplace: "Hybrid",
    type: "Part-time",
    level: "Mid",
    category: "Finance",
    salaryMin: 2500,
    salaryMax: 3800,
    currency: "$",
    postedDaysAgo: 10,
    description:
      "იმუშავებ ბიუჯეტირებაზე, პროგნოზირებასა და ანგარიშგებაზე. ააწყობ მოდელებს, რომლებიც მენეჯმენტს სწორ გადაწყვეტილებებში ეხმარება.",
    tags: ["Excel", "მოდელირება", "ანგარიშგება"],
    applicants: 9,
  },
  {
    id: "10",
    title: "პლატფორმის წამყვანი ინჟინერი",
    company: "მერიდიან AI",
    logo: "/logos/meridian.png",
    location: "დისტანციური, გლობალურად",
    workplace: "Remote",
    type: "Full-time",
    level: "Lead",
    category: "Engineering",
    salaryMin: 6500,
    salaryMax: 9000,
    currency: "$",
    postedDaysAgo: 2,
    description:
      "უხელმძღვანელებ cloud პლატფორმის არქიტექტურას. განსაზღვრავ ტექნიკურ მიმართულებას და აამაღლებ ინჟინერიის ხარისხს.",
    tags: ["AWS", "Terraform", "Go", "განაწილებული სისტემები"],
    applicants: 26,
    hrActive: true,
    comments: [
      {
        id: "10-1",
        author: "ანა",
        profession: "DevOps ინჟინერი",
        avatar: "https://i.pravatar.cc/96?u=ana-k",
        body: "ლიდის პოზიციაზე hands-on coding რამდენია? მენეჯმენტი მაინტერესებს, მაგრამ კოდისგან სრულად მოშორება არ მინდა.",
        postedDaysAgo: 1,
        relevant: true,
      },
    ],
  },
]
