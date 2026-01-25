'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Users, Search, Mail, Briefcase } from 'lucide-react'

interface Recruiter {
  id: string
  full_name: string | null
  email: string
  specializations: string[] | null
  bio: string | null
  avatar_url: string | null
  is_available: boolean
}

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchRecruiters()
  }, [])

  async function fetchRecruiters() {
    const { data, error } = await supabase
      .from('recruiters')
      .select('id, full_name, email, specializations, bio, avatar_url, is_available')
      .order('full_name')

    if (!error && data) {
      setRecruiters(data.map(r => ({ ...r, is_available: r.is_available !== false })))
    }
    setLoading(false)
  }

  const filteredRecruiters = recruiters.filter(r => {
    const query = searchQuery.toLowerCase()
    const nameMatch = r.full_name?.toLowerCase().includes(query) || r.email.toLowerCase().includes(query)
    const specMatch = r.specializations?.some(s => s.toLowerCase().includes(query))
    return nameMatch || specMatch
  })

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
            <div className="p-3 bg-teal-500 rounded-lg">
              <Users className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Team Directory</h1>
              <p className="text-white/70">Find recruiters and their specializations</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">{recruiters.length}</div>
            <div className="text-sm text-gray-500">Total Recruiters</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-green-600">
              {recruiters.filter(r => r.is_available).length}
            </div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">
              {new Set(recruiters.flatMap(r => r.specializations || [])).size}
            </div>
            <div className="text-sm text-gray-500">Specializations Covered</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">
              {recruiters.filter(r => r.specializations && r.specializations.length > 0).length}
            </div>
            <div className="text-sm text-gray-500">With Listed Specializations</div>
          </div>
        </div>

        {/* Recruiters Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredRecruiters.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? `No recruiters found matching "${searchQuery}"` : 'No recruiters found'}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRecruiters.map((recruiter) => (
              <Link
                key={recruiter.id}
                href={`/recruiters/${recruiter.id}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all group"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-xl font-bold flex-shrink-0">
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
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 group-hover:text-brand-accent transition-colors truncate">
                        {recruiter.full_name || recruiter.email.split('@')[0]}
                      </h3>
                      <span className={`px-2 py-0.5 text-xs rounded-full font-medium flex-shrink-0 ${
                        recruiter.is_available 
                          ? 'bg-green-100 text-green-700' 
                          : 'bg-gray-100 text-gray-500'
                      }`}>
                        {recruiter.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                      <Mail className="w-3 h-3" />
                      <span className="truncate">{recruiter.email}</span>
                    </div>
                  </div>
                </div>

                {recruiter.specializations && recruiter.specializations.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                      <Briefcase className="w-3 h-3" />
                      Specializations
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {recruiter.specializations.slice(0, 3).map((spec, index) => (
                        <span 
                          key={spec}
                          className={`px-2 py-0.5 text-xs rounded-full ${
                            index === 0 
                              ? 'bg-teal-100 text-teal-800 font-medium' 
                              : 'bg-teal-50 text-teal-700'
                          }`}
                        >
                          {spec}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {recruiter.bio && (
                  <p className="mt-3 text-sm text-gray-500 line-clamp-2">{recruiter.bio}</p>
                )}
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
