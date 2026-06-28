import localFont from 'next/font/local'

const dachi = localFont({
  src: '../../public/fonts/dachi.otf',
  variable: '--font-dachi',
  display: 'swap',
})

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return <div className={dachi.variable}>{children}</div>
}
