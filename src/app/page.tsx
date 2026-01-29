'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  Users, 
  GraduationCap, 
  Megaphone, 
  FileText, 
  Briefcase,
  ArrowRight,
  TrendingUp,
  Building,
  LogOut,
  Trophy,
  BarChart3,
  MapPin,
  ExternalLink,
  Shield,
  Settings,
  Lightbulb,
  Gift,
  Plug
} from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  summary: string
  created_at: string
}

export default function HubPage() {
  const [latestBlog, setLatestBlog] = useState<BlogPost | null>(null)
  const [user, setUser] = useState<any>(null)
  const [userName, setUserName] = useState<string | null>(null)
  const [userCity, setUserCity] = useState<string | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    fetchLatestBlog()
    fetchUser()
  }, [])

  async function fetchUser() {
    const { data: { user } } = await supabase.auth.getUser()
    setUser(user)
    
    if (user) {
      // Fetch recruiter profile to get name, city and admin status
      const { data: recruiter } = await supabase
        .from('recruiters')
        .select('full_name, city, is_admin')
        .eq('id', user.id)
        .single()
      
      if (recruiter?.full_name) {
        setUserName(recruiter.full_name)
      }
      if (recruiter?.city) {
        setUserCity(recruiter.city)
      }
      if (recruiter?.is_admin) {
        setIsAdmin(true)
      }
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut()
    window.location.href = '/auth/login'
  }

  async function fetchLatestBlog() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, summary, created_at')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!error && data) {
      setLatestBlog(data)
    }
  }

  const quickLinks = [
    // Row 1
    {
      title: 'ATS',
      description: 'Applicant Tracking System - Manage jobs, candidates, and clients',
      href: 'https://ats.search.market',
      icon: Briefcase,
      color: 'bg-blue-500',
      external: true
    },
    {
      title: 'Contracts',
      description: 'Manage contracts, agreements, and documents',
      href: '/contracts',
      icon: FileText,
      color: 'bg-slate-500',
      external: false
    },
    {
      title: 'Reports',
      description: 'Analytics, metrics, and performance reports',
      href: '/reports',
      icon: BarChart3,
      color: 'bg-cyan-500',
      external: false
    },
    // Row 2
    {
      title: 'Recruiters',
      description: 'View all recruiters and their specializations',
      href: '/recruiters',
      icon: Users,
      color: 'bg-teal-500',
      external: false
    },
    {
      title: 'Agencies',
      description: 'Create or join an agency on the platform',
      href: '/agencies',
      icon: Building,
      color: 'bg-indigo-500',
      external: false
    },
    {
      title: 'Leaderboard',
      description: 'Top performing recruiters and agencies',
      href: '/leaderboard',
      icon: Trophy,
      color: 'bg-yellow-500',
      external: false
    },
    // Row 3
    {
      title: 'Marketing Tools',
      description: 'Templates, brand assets, and marketing resources',
      href: '/marketing',
      icon: Megaphone,
      color: 'bg-orange-500',
      external: false
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
      title: 'Policies & Procedures',
      description: 'Company policies, guidelines, and standard procedures',
      href: '/policies',
      icon: FileText,
      color: 'bg-green-500',
      external: false
    },
    // Row 4
    {
      title: 'Feature Request',
      description: 'Submit ideas and vote on new features',
      href: '/feature-requests',
      icon: Lightbulb,
      color: 'bg-amber-500',
      external: false
    },
    {
      title: 'Swag',
      description: 'Order branded merchandise and company gear',
      href: '/swag',
      icon: Gift,
      color: 'bg-pink-500',
      external: false
    },
    {
      title: 'External Services',
      description: 'Third-party tools, integrations, and partner services',
      href: '/external-services',
      icon: Plug,
      color: 'bg-gray-600',
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
            <div className="flex items-center gap-4">
              {user && (
                <div className="hidden md:block text-right">
                  {userName && (
                    <span className="text-white font-medium block">
                      {userName}
                    </span>
                  )}
                  <span className="text-white/70 text-sm block">
                    {user.email}
                  </span>
                  {isAdmin && (
                    <Link 
                      href="/admin" 
                      className="text-xs text-red-300 hover:text-red-200 flex items-center gap-1 justify-end"
                    >
                      <Shield className="w-3 h-3" />
                      Admin
                    </Link>
                  )}
                </div>
              )}
              <a 
                href="https://ats.search.market"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-brand-green rounded-lg hover:bg-green-600 transition-colors"
              >
                <Briefcase className="w-4 h-4" />
                Open ATS
              </a>
              <a 
                href="https://ats.search.market/dashboard/settings"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
              >
                <Settings className="w-4 h-4" />
                <span className="hidden md:inline">Settings</span>
              </a>
              {user ? (
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="hidden md:inline">Logout</span>
                </button>
              ) : (
                <Link
                  href="/auth/login"
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
                >
                  Login
                </Link>
              )}
            </div>
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
              <Link href={`/blog/${latestBlog.slug}`} className="block group">
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

          {/* Local Jobs News */}
          <section className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-blue-500" />
                Local Jobs News
              </h2>
            </div>
            {userCity ? (
              <div>
                <p className="text-sm text-gray-600 mb-4">
                  Latest job market news for <span className="font-semibold">{userCity}</span>
                </p>
                <a
                  href={(() => {
                    const yesterday = new Date()
                    yesterday.setDate(yesterday.getDate() - 1)
                    const dateStr = yesterday.toISOString().split('T')[0]
                    return `https://www.google.com/search?q=${encodeURIComponent(userCity + ' jobs news after:' + dateStr)}`
                  })()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  Search {userCity} Jobs News
                </a>
                <p className="text-xs text-gray-400 mt-3">
                  Opens Google search for recent job news in your area
                </p>
              </div>
            ) : (
              <div>
                <p className="text-gray-500 text-sm mb-3">
                  Add your city in your profile settings to see local job news.
                </p>
                <Link 
                  href="https://ats.search.market/dashboard/settings"
                  className="text-brand-accent hover:underline text-sm"
                >
                  Update your profile →
                </Link>
              </div>
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
