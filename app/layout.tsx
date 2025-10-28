import '../styles/globals.css'
export const metadata = { title: 'WJ — Protótipo WhatsApp UI By Guilherme Spode', description: 'Protótipo com Next.js + Tailwind' }
export default function RootLayout({ children }: { children: React.ReactNode }){
  return (<html lang="pt-br"><body>{children}</body></html>)
}
