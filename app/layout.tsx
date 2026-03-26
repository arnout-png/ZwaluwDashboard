import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Sidebar } from '@/components/nav/Sidebar'
import './globals.css'

export const metadata: Metadata = {
  title: 'Zwaluw HQ',
  description: 'Infrastructuur manager voor alle Zwaluw Comfortsanitair projecten',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="nl" className="dark">
      <body className={`${GeistSans.variable} ${GeistMono.variable} font-sans antialiased`}>
        <div className="flex h-screen overflow-hidden bg-zinc-950">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}
