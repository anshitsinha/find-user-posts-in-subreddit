import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'find-user-posts-in-subreddit',
  description: 'See every post a user has made in any subreddit. A simple tool for understanding how someone participates in a community.',
  openGraph: {
    title: 'find-user-posts-in-subreddit',
    description: 'See every post a user has made in any subreddit.',
    type: 'website',
  },
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