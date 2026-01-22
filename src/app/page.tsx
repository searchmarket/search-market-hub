'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  Users, 
  GraduationCap, 
  Megaphone, 
  FileText, 
  Newspaper,
  Briefcase,
  ArrowRight,
  TrendingUp
} from 'lucide-react'

interface Recruiter {
  id: string
  full_name: string | null
  email: string
  specializations: string[] | null
}

interface BlogPost {
  id: string
  title: string
  summary: string
  created_at: string
}

export default function HubPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [latestBlog, setLatestBlog] = useState<BlogPost | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchRecruiters()
    fetchLatestBlog()
  }, [])

  async function fetchRecruiters() {
    const { data, error } = await supabase
      .from('recruiters')
      .select('id, full_name, email, specializations')
      .limit(5)

    if (!error && data) {
      setRecruiters(data)
    }
  }

  async function fetchLatestBlog() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!error && data) {
      setLatestBlog(data)
    }
  }

  const quickLinks = [
    {
      title: 'ATS',
      description: 'Applicant Tracking System - Manage jobs, candidates, and clients',
      href: 'https://ats.search.market',
      icon: Briefcase,
      color: 'bg-blue-500',
      external: true
    },
    {
      title: 'Recruiter School',
      description: 'Training materials, best practices, and onboarding resources',
      href: '/school',
      icon: GraduationCap,
      color: 'bg-purple-500',
      external: false
    },
    {
      title: 'Marketing Tools',
      description: 'Templates, brand assets, and marketing resources',
      href: '/marketing',
      icon: Megaphone,
      color: 'bg-orange-500',
      external: false
    },
    {
      title: 'Policies & Procedures',
      description: 'Company policies, guidelines, and standard procedures',
      href: '/policies',
      icon: FileText,
      color: 'bg-green-500',
      external: false
    },
    {
      title: 'Industry News',
      description: 'Daily AI-curated recruitment industry news and insights',
      href: '/blog',
      icon: Newspaper,
      color: 'bg-red-500',
      external: false
    },
    {
      title: 'Team Directory',
      description: 'View all recruiters and their specializations',
      href: '/recruiters',
      icon: Users,
      color: 'bg-teal-500',
      external: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-brand-green rounded-lg flex items-center justify-center text-white font-bold">
                SM
              </div>
              <div>
                <h1 className="text-2xl font-bold">Search Market Hub</h1>
                <p className="text-white/70 text-sm">Your central workspace</p>
              </div>
            </div>
            <Link 
              href="https://ats.search.market"
              className="flex items-center gap-2 px-4 py-2 bg-brand-green rounded-lg hover:bg-green-600 transition-colors"
            >
              <Briefcase className="w-4 h-4" />
              Open ATS
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Quick Links Grid */}
        <section className="mb-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Quick Access</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {quickLinks.map((link) => (
              <Link
                key={link.title}
                href={link.href}
                target={link.external ? '_blank' : undefined}
                className="group bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`${link.color} p-3 rounded-lg text-white`}>
                    <link.icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-accent transition-colors flex items-center gap-2">
                      {link.title}
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{link.description}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Latest News */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-red-500" />
                Latest Industry News
              </h2>
              <Link href="/blog" className="text-sm text-brand-accent hover:underline">
                View all →
              </Link>
            </div>
            {latestBlog ? (
              <Link href={`/blog/${latestBlog.id}`} className="block group">
                <h3 className="font-medium text-gray-900 group-hover:text-brand-accent transition-colors">
                  {latestBlog.title}
                </h3>
                <p className="text-sm text-gray-500 mt-2 line-clamp-2">{latestBlog.summary}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(latestBlog.created_at).toLocaleDateString()}
                </p>
              </Link>
            ) : (
              <p className="text-gray-500 text-sm">No news articles yet. Check back tomorrow!</p>
            )}
          </section>

          {/* Team Preview */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-teal-500" />
                Team Members
              </h2>
              <Link href="/recruiters" className="text-sm text-brand-accent hover:underline">
                View all →
              </Link>
            </div>
            {recruiters.length > 0 ? (
              <div className="space-y-3">
                {recruiters.map((recruiter) => (
                  <Link 
                    key={recruiter.id} 
                    href={`/recruiters/${recruiter.id}`}
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-600 font-medium">
                      {recruiter.full_name?.charAt(0) || recruiter.email.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {recruiter.full_name || recruiter.email}
                      </div>
                      {recruiter.specializations && recruiter.specializations.length > 0 && (
                        <div className="text-xs text-gray-500">
                          {recruiter.specializations.slice(0, 2).join(', ')}
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">No team members found.</p>
            )}
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          © {new Date().getFullYear()} Search Market. Internal use only.
        </div>
      </footer>
    </div>
  )
}
