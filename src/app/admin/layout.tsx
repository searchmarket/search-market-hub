import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Admin | Search.Market',
}

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return children
}
