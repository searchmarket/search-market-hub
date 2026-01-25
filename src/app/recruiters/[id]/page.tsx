'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Mail, Briefcase, User, MapPin, TrendingUp, Clock, DollarSign, BarChart3, Loader2 } from 'lucide-react'

interface Recruiter {
  id: string
  full_name: string | null
  email: string
  specializations: string[] | null
  bio: string | null
  avatar_url: string | null
  city: string | null
  state_province: string | null
  country: string | null
  is_available: boolean
  linkedin_url: string | null
  phone: string | null
}

interface RecruiterStats {
  ytd_revenue: number
  mtd_revenue: number
  last_month_revenue: number
  lifetime_revenue: number
  ytd_placements: number
  mtd_placements: number
  lifetime_placements: number
  avg_time_to_fill: number
  avg_time_to_fill_ytd: number
  active_jobs: number
  active_candidates: number
}

export default function RecruiterDetailPage() {
  const params = useParams()
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null)
  const [stats, setStats] = useState<RecruiterStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [loadingStats, setLoadingStats] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchRecruiter(params.id as string)
      fetchStats(params.id as string)
    }
  }, [params.id])

  async function fetchRecruiter(id: string) {
    const { data, error } = await supabase
      .from('recruiters')
      .select('id, full_name, email, specializations, bio, avatar_url, city, state_province, country, is_available, linkedin_url, phone')
      .eq('id', id)
      .single()

    if (!error && data) {
      setRecruiter(data)
    }
    setLoading(false)
  }

  async function fetchStats(id: string) {
    const { data, error } = await supabase
      .from('recruiter_stats')
      .select('*')
      .eq('recruiter_id', id)
      .single()

    if (!error && data) {
      setStats(data)
    }
    setLoadingStats(false)
  }

  function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount)
  }

  function formatLocation(): string | null {
    if (!recruiter) return null
    const parts = [recruiter.city, recruiter.state_province, recruiter.country].filter(Boolean)
    return parts.length > 0 ? parts.join(', ') : null
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!recruiter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Recruiter not found</div>
          <Link href="/recruiters" className="text-brand-accent hover:underline">
            Back to directory
          </Link>
        </div>
      </div>
    )
  }

  const location = formatLocation()

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/recruiters" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {recruiter.avatar_url ? (
                <img 
                  src={recruiter.avatar_url} 
                  alt={recruiter.full_name || ''} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                recruiter.full_name?.charAt(0) || recruiter.email.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold">
                  {recruiter.full_name || recruiter.email.split('@')[0]}
                </h1>
                <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                  recruiter.is_available 
                    ? 'bg-green-500/20 text-green-200' 
                    : 'bg-gray-500/20 text-gray-300'
                }`}>
                  {recruiter.is_available ? 'Available' : 'Unavailable'}
                </span>
              </div>
              <div className="flex items-center gap-4 text-white/70 mt-2">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href={`mailto:${recruiter.email}`} className="hover:text-white">
                    {recruiter.email}
                  </a>
                </div>
                {location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {location}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-gray-400" />
            Performance Stats
          </h2>
          {loadingStats ? (
            <div className="flex items-center gap-2 text-gray-500 py-4">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading stats...
            </div>
          ) : stats ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 text-green-600 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">YTD Revenue</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.ytd_revenue)}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 text-blue-600 mb-2">
                  <DollarSign className="w-5 h-5" />
                  <span className="text-sm font-medium">MTD Revenue</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(stats.mtd_revenue)}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 text-purple-600 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm font-medium">YTD Placements</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.ytd_placements}</div>
              </div>
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-2 text-orange-600 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm font-medium">Avg Time to Fill</span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{stats.avg_time_to_fill.toFixed(1)} days</div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <p className="text-gray-500">No performance data available yet</p>
            </div>
          )}

          {/* Additional Stats Row */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-sm text-gray-500">MTD Placements</div>
                <div className="text-xl font-bold text-gray-900">{stats.mtd_placements}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-sm text-gray-500">Lifetime Revenue</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(stats.lifetime_revenue)}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-sm text-gray-500">Active Jobs</div>
                <div className="text-xl font-bold text-gray-900">{stats.active_jobs}</div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="text-sm text-gray-500">Active Candidates</div>
                <div className="text-xl font-bold text-gray-900">{stats.active_candidates}</div>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                About
              </h2>
              {recruiter.bio ? (
                <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{recruiter.bio}</p>
              ) : (
                <p className="text-gray-400 italic">No bio added yet.</p>
              )}
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="flex flex-wrap gap-3">
                <a 
                  href={`mailto:${recruiter.email}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  Send Email
                </a>
                {recruiter.phone && (
                  <a 
                    href={`tel:${recruiter.phone}`}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    {recruiter.phone}
                  </a>
                )}
                {recruiter.linkedin_url && (
                  <a 
                    href={recruiter.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                  >
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Specializations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-400" />
                Specializations
              </h2>
              {recruiter.specializations && recruiter.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recruiter.specializations.map((spec, index) => (
                    <span 
                      key={spec}
                      className={`px-3 py-1 text-sm rounded-full ${
                        index === 0 
                          ? 'bg-teal-100 text-teal-800 font-medium' 
                          : 'bg-teal-50 text-teal-700'
                      }`}
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">No specializations listed.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
