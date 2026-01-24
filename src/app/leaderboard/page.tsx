'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Trophy, Users, Building, Medal, Award, Star } from 'lucide-react'

interface RecruiterStats {
  id: string
  full_name: string | null
  email: string
  photo_url: string | null
  placements: number
  jobs_count: number
  candidates_count: number
}

interface AgencyStats {
  id: string
  name: string
  slug: string
  logo_url: string | null
  primary_color: string
  member_count: number
  placements: number
}

export default function LeaderboardPage() {
  const [recruiters, setRecruiters] = useState<RecruiterStats[]>([])
  const [agencies, setAgencies] = useState<AgencyStats[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'recruiters' | 'agencies'>('recruiters')
  const supabase = createClient()

  useEffect(() => {
    fetchLeaderboard()
  }, [])

  async function fetchLeaderboard() {
    // Fetch recruiters with their stats
    const { data: recruiterData } = await supabase
      .from('recruiters')
      .select('id, full_name, email, photo_url')
      .order('full_name')

    if (recruiterData) {
      // For now, simulate stats - in production these would come from actual placement data
      const recruitersWithStats = recruiterData.map((r, index) => ({
        ...r,
        placements: Math.floor(Math.random() * 50),
        jobs_count: Math.floor(Math.random() * 30),
        candidates_count: Math.floor(Math.random() * 100)
      })).sort((a, b) => b.placements - a.placements)
      
      setRecruiters(recruitersWithStats)
    }

    // Fetch agencies with member count
    const { data: agencyData } = await supabase
      .from('agencies')
      .select(`
        id, name, slug, logo_url, primary_color,
        agency_members(count)
      `)
      .eq('status', 'active')
      .order('name')

    if (agencyData) {
      const agenciesWithStats = agencyData.map((a, index) => ({
        ...a,
        member_count: a.agency_members?.[0]?.count || 0,
        placements: Math.floor(Math.random() * 100)
      })).sort((a, b) => b.placements - a.placements)
      
      setAgencies(agenciesWithStats)
    }

    setLoading(false)
  }

  const getMedalColor = (index: number) => {
    if (index === 0) return 'text-yellow-500'
    if (index === 1) return 'text-gray-400'
    if (index === 2) return 'text-amber-600'
    return 'text-gray-300'
  }

  const getMedalIcon = (index: number) => {
    if (index < 3) return <Medal className={`w-6 h-6 ${getMedalColor(index)}`} />
    return <span className="w-6 h-6 flex items-center justify-center text-gray-400 font-medium">{index + 1}</span>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-500 rounded-lg">
              <Trophy className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Leaderboard</h1>
              <p className="text-white/70">Top performing recruiters and agencies</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('recruiters')}
              className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'recruiters'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Top Recruiters
            </button>
            <button
              onClick={() => setActiveTab('agencies')}
              className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'agencies'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="w-4 h-4" />
              Top Agencies
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : activeTab === 'recruiters' ? (
          <div className="space-y-4">
            {/* Top 3 Podium */}
            {recruiters.length >= 3 && (
              <div className="grid grid-cols-3 gap-4 mb-8">
                {/* Second Place */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center mt-8">
                  <div className="w-16 h-16 mx-auto rounded-full bg-gray-100 flex items-center justify-center mb-3">
                    {recruiters[1]?.photo_url ? (
                      <img src={recruiters[1].photo_url} alt="" className="w-16 h-16 rounded-full object-cover" />
                    ) : (
                      <span className="text-2xl font-bold text-gray-400">
                        {recruiters[1]?.full_name?.charAt(0) || recruiters[1]?.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <Medal className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">{recruiters[1]?.full_name || recruiters[1]?.email}</h3>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{recruiters[1]?.placements}</p>
                  <p className="text-xs text-gray-500">placements</p>
                </div>

                {/* First Place */}
                <div className="bg-gradient-to-b from-yellow-50 to-white rounded-xl shadow-md border border-yellow-200 p-6 text-center">
                  <div className="w-20 h-20 mx-auto rounded-full bg-yellow-100 flex items-center justify-center mb-3 ring-4 ring-yellow-300">
                    {recruiters[0]?.photo_url ? (
                      <img src={recruiters[0].photo_url} alt="" className="w-20 h-20 rounded-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-yellow-600">
                        {recruiters[0]?.full_name?.charAt(0) || recruiters[0]?.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <Trophy className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900 text-lg">{recruiters[0]?.full_name || recruiters[0]?.email}</h3>
                  <p className="text-3xl font-bold text-yellow-600 mt-2">{recruiters[0]?.placements}</p>
                  <p className="text-xs text-gray-500">placements</p>
                </div>

                {/* Third Place */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 text-center mt-12">
                  <div className="w-14 h-14 mx-auto rounded-full bg-amber-50 flex items-center justify-center mb-3">
                    {recruiters[2]?.photo_url ? (
                      <img src={recruiters[2].photo_url} alt="" className="w-14 h-14 rounded-full object-cover" />
                    ) : (
                      <span className="text-xl font-bold text-amber-600">
                        {recruiters[2]?.full_name?.charAt(0) || recruiters[2]?.email.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <Medal className="w-7 h-7 text-amber-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-gray-900">{recruiters[2]?.full_name || recruiters[2]?.email}</h3>
                  <p className="text-xl font-bold text-gray-900 mt-2">{recruiters[2]?.placements}</p>
                  <p className="text-xs text-gray-500">placements</p>
                </div>
              </div>
            )}

            {/* Full List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">All Recruiters</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {recruiters.map((recruiter, index) => (
                  <div key={recruiter.id} className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50">
                    <div className="w-8 flex justify-center">
                      {getMedalIcon(index)}
                    </div>
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                      {recruiter.photo_url ? (
                        <img src={recruiter.photo_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : (
                        <span className="font-medium text-gray-500">
                          {recruiter.full_name?.charAt(0) || recruiter.email.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{recruiter.full_name || recruiter.email}</h3>
                      <p className="text-sm text-gray-500">{recruiter.jobs_count} jobs • {recruiter.candidates_count} candidates</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{recruiter.placements}</p>
                      <p className="text-xs text-gray-500">placements</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Agencies List */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h2 className="font-semibold text-gray-900">All Agencies</h2>
              </div>
              <div className="divide-y divide-gray-100">
                {agencies.map((agency, index) => (
                  <Link 
                    key={agency.id} 
                    href={`/agencies/${agency.slug}`}
                    className="px-6 py-4 flex items-center gap-4 hover:bg-gray-50"
                  >
                    <div className="w-8 flex justify-center">
                      {getMedalIcon(index)}
                    </div>
                    <div 
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: agency.primary_color || '#1B2B4B' }}
                    >
                      {agency.logo_url ? (
                        <img src={agency.logo_url} alt="" className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="font-bold text-white text-sm">
                          {agency.name.substring(0, 2).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{agency.name}</h3>
                      <p className="text-sm text-gray-500">{agency.member_count} members</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-gray-900">{agency.placements}</p>
                      <p className="text-xs text-gray-500">placements</p>
                    </div>
                  </Link>
                ))}
                {agencies.length === 0 && (
                  <div className="px-6 py-12 text-center text-gray-500">
                    No agencies yet
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
