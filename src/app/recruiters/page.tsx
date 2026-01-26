'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Users, Search, MapPin, Linkedin } from 'lucide-react'

const STATE_ABBREVIATIONS: Record<string, string> = {
  // US States
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR', 'California': 'CA',
  'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE', 'Florida': 'FL', 'Georgia': 'GA',
  'Hawaii': 'HI', 'Idaho': 'ID', 'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA',
  'Kansas': 'KS', 'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS', 'Missouri': 'MO',
  'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV', 'New Hampshire': 'NH', 'New Jersey': 'NJ',
  'New Mexico': 'NM', 'New York': 'NY', 'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH',
  'Oklahoma': 'OK', 'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT', 'Vermont': 'VT',
  'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV', 'Wisconsin': 'WI', 'Wyoming': 'WY',
  // Canadian Provinces
  'Alberta': 'AB', 'British Columbia': 'BC', 'Manitoba': 'MB', 'New Brunswick': 'NB',
  'Newfoundland and Labrador': 'NL', 'Northwest Territories': 'NT', 'Nova Scotia': 'NS',
  'Nunavut': 'NU', 'Ontario': 'ON', 'Prince Edward Island': 'PE', 'Quebec': 'QC',
  'Saskatchewan': 'SK', 'Yukon': 'YT'
}

interface Recruiter {
  id: string
  full_name: string | null
  email: string
  specializations: string[] | null
  bio: string | null
  avatar_url: string | null
  is_available: boolean
  city: string | null
  state_province: string | null
  country: string | null
  linkedin_url: string | null
}

type CountryFilter = 'all' | 'us' | 'canada'

export default function RecruitersPage() {
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [countryFilter, setCountryFilter] = useState<CountryFilter>('all')
  const supabase = createClient()

  useEffect(() => {
    fetchRecruiters()
  }, [])

  async function fetchRecruiters() {
    const { data, error } = await supabase
      .from('recruiters')
      .select('id, full_name, email, specializations, bio, avatar_url, is_available, city, state_province, country, linkedin_url')
      .order('full_name')

    if (!error && data) {
      setRecruiters(data.map(r => ({ ...r, is_available: r.is_available !== false })))
    }
    setLoading(false)
  }

  const filteredRecruiters = recruiters.filter(r => {
    // Country filter
    if (countryFilter === 'us' && r.country !== 'United States') return false
    if (countryFilter === 'canada' && r.country !== 'Canada') return false
    
    // Search filter
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    const nameMatch = r.full_name?.toLowerCase().includes(query) || r.email.toLowerCase().includes(query)
    const specMatch = r.specializations?.some(s => s.toLowerCase().includes(query))
    const locationMatch = r.city?.toLowerCase().includes(query) || r.state_province?.toLowerCase().includes(query)
    return nameMatch || specMatch || locationMatch
  })

  const usCount = recruiters.filter(r => r.country === 'United States').length
  const canadaCount = recruiters.filter(r => r.country === 'Canada').length

  function formatLocation(recruiter: Recruiter): string | null {
    const stateAbbr = recruiter.state_province ? (STATE_ABBREVIATIONS[recruiter.state_province] || recruiter.state_province) : null
    if (recruiter.city && stateAbbr) {
      return `${recruiter.city}, ${stateAbbr}`
    }
    if (recruiter.city) return recruiter.city
    if (stateAbbr) return stateAbbr
    return null
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
        {/* Country Tabs */}
        <div className="flex items-center gap-1 mb-6 bg-white rounded-lg p-1 shadow-sm border border-gray-100 w-fit">
          <button
            onClick={() => setCountryFilter('all')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              countryFilter === 'all'
                ? 'bg-brand-navy text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({recruiters.length})
          </button>
          <button
            onClick={() => setCountryFilter('us')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              countryFilter === 'us'
                ? 'bg-brand-navy text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🇺🇸 United States ({usCount})
          </button>
          <button
            onClick={() => setCountryFilter('canada')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              countryFilter === 'canada'
                ? 'bg-brand-navy text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🇨🇦 Canada ({canadaCount})
          </button>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, specialization, or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">{filteredRecruiters.length}</div>
            <div className="text-sm text-gray-500">
              {countryFilter === 'all' ? 'Total Recruiters' : countryFilter === 'us' ? 'US Recruiters' : 'Canadian Recruiters'}
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-green-600">
              {filteredRecruiters.filter(r => r.is_available).length}
            </div>
            <div className="text-sm text-gray-500">Available</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">
              {new Set(filteredRecruiters.flatMap(r => r.specializations || [])).size}
            </div>
            <div className="text-sm text-gray-500">Specializations Covered</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">
              {filteredRecruiters.filter(r => r.specializations && r.specializations.length > 0).length}
            </div>
            <div className="text-sm text-gray-500">With Listed Specializations</div>
          </div>
        </div>

        {/* Recruiters List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredRecruiters.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            {searchQuery ? `No recruiters found matching "${searchQuery}"` : 'No recruiters found'}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredRecruiters.map((recruiter) => (
                <Link
                  key={recruiter.id}
                  href={`/recruiters/${recruiter.id}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
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

                  {/* Name */}
                  <div className="w-40 flex-shrink-0">
                    <h3 className="font-medium text-gray-900 group-hover:text-brand-accent transition-colors truncate">
                      {recruiter.full_name || recruiter.email.split('@')[0]}
                    </h3>
                  </div>

                  {/* Location */}
                  <div className="w-40 flex-shrink-0 hidden md:block">
                    {formatLocation(recruiter) ? (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="w-3 h-3 flex-shrink-0" />
                        <span className="truncate">{formatLocation(recruiter)}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </div>

                  {/* Email */}
                  <div className="w-56 flex-shrink-0 hidden lg:block">
                    <span className="text-sm text-gray-500 truncate block">{recruiter.email}</span>
                  </div>

                  {/* LinkedIn */}
                  <div className="w-10 flex-shrink-0 flex justify-center">
                    {recruiter.linkedin_url ? (
                      <a
                        href={recruiter.linkedin_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          window.open(recruiter.linkedin_url!, '_blank')
                        }}
                        className="p-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors"
                        title="View LinkedIn Profile"
                      >
                        <Linkedin className="w-4 h-4" />
                      </a>
                    ) : (
                      <span className="p-1.5 text-gray-300">
                        <Linkedin className="w-4 h-4" />
                      </span>
                    )}
                  </div>

                  {/* Specializations */}
                  <div className="flex-1 hidden xl:flex items-center gap-2">
                    {recruiter.specializations && recruiter.specializations.length > 0 ? (
                      recruiter.specializations.slice(0, 2).map((spec, index) => (
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
                      ))
                    ) : (
                      <span className="text-sm text-gray-400">No specializations</span>
                    )}
                  </div>

                  {/* Status */}
                  <div className="flex-shrink-0">
                    <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                      recruiter.is_available 
                        ? 'bg-green-100 text-green-700' 
                        : 'bg-gray-100 text-gray-500'
                    }`}>
                      {recruiter.is_available ? 'Available' : 'Unavailable'}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
