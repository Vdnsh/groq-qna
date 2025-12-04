import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Groq QnA Playground',
  description: 'Single-turn QnA interface powered by Groq',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}

