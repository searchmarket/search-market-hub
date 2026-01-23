'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Building, Search, Users, Globe, Lock, Plus } from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  tagline: string | null
  is_public: boolean
  primary_color: string
  member_count?: number
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchAgencies()
  }, [])

  async function fetchAgencies() {
    // Fetch public agencies with member count
    const { data, error } = await supabase
      .from('agencies')
      .select(`
        id, name, slug, description, logo_url, tagline, is_public, primary_color,
        agency_members(count)
      `)
      .eq('is_public', true)
      .eq('status', 'active')
      .order('name')

    if (!error && data) {
      const agenciesWithCount = data.map(agency => ({
        ...agency,
        member_count: agency.agency_members?.[0]?.count || 0
      }))
      setAgencies(agenciesWithCount)
    }
    setLoading(false)
  }

  const filteredAgencies = agencies.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500 rounded-lg">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Virtual Agencies</h1>
                <p className="text-white/70">Discover agencies on the platform</p>
              </div>
            </div>
            <Link
              href="/agencies/create"
              className="flex items-center gap-2 px-4 py-2 bg-brand-green rounded-lg hover:bg-green-600 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Agency
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="mb-8 flex items-center justify-between">
          <div className="relative max-w-md flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search agencies..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
          <Link
            href="/agencies/my"
            className="ml-4 px-4 py-3 text-sm text-brand-accent hover:bg-blue-50 rounded-lg transition-colors"
          >
            My Agencies
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">{agencies.length}</div>
            <div className="text-sm text-gray-500">Public Agencies</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">
              {agencies.reduce((sum, a) => sum + (a.member_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-brand-green">Free</div>
            <div className="text-sm text-gray-500">To Create Your Own</div>
          </div>
        </div>

        {/* Agencies Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredAgencies.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery ? `No agencies found matching "${searchQuery}"` : 'No public agencies yet'}
            </p>
            <Link href="/agencies/create" className="text-brand-accent hover:underline">
              Be the first to create one →
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAgencies.map((agency) => (
              <Link
                key={agency.id}
                href={`/agencies/${agency.slug}`}
                className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md hover:border-gray-200 transition-all group"
              >
                {/* Agency Header */}
                <div 
                  className="h-20 flex items-center justify-center"
                  style={{ backgroundColor: agency.primary_color || '#1B2B4B' }}
                >
                  {agency.logo_url ? (
                    <img 
                      src={agency.logo_url} 
                      alt={agency.name} 
                      className="h-12 w-auto object-contain"
                    />
                  ) : (
                    <span className="text-white text-2xl font-bold">
                      {agency.name.substring(0, 2).toUpperCase()}
                    </span>
                  )}
                </div>
                
                {/* Agency Info */}
                <div className="p-5">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-gray-900 group-hover:text-brand-accent transition-colors">
                      {agency.name}
                    </h3>
                    <span className="flex items-center gap-1 text-xs text-gray-400">
                      <Globe className="w-3 h-3" />
                      Public
                    </span>
                  </div>
                  
                  {agency.tagline && (
                    <p className="text-sm text-gray-500 mb-3 line-clamp-1">{agency.tagline}</p>
                  )}
                  
                  {agency.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">{agency.description}</p>
                  )}
                  
                  <div className="flex items-center gap-1 text-sm text-gray-400">
                    <Users className="w-4 h-4" />
                    {agency.member_count} {agency.member_count === 1 ? 'member' : 'members'}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
