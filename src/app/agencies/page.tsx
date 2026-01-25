'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Building, Search, Users, Globe, Lock, Plus, UserPlus, Check, Loader2 } from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  tagline: string | null
  is_public: boolean
  is_accepting_members: boolean
  primary_color: string
  member_count?: number
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [userMemberships, setUserMemberships] = useState<string[]>([]) // agency IDs user is member of
  const [userApplications, setUserApplications] = useState<string[]>([]) // agency IDs user has applied to
  const [applyingTo, setApplyingTo] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      setCurrentUserId(user.id)
      
      // Fetch user's memberships
      const { data: memberships } = await supabase
        .from('agency_members')
        .select('agency_id')
        .eq('recruiter_id', user.id)
      
      if (memberships) {
        setUserMemberships(memberships.map(m => m.agency_id))
      }

      // Fetch user's pending applications
      const { data: applications } = await supabase
        .from('agency_applications')
        .select('agency_id')
        .eq('recruiter_id', user.id)
        .eq('status', 'pending')
      
      if (applications) {
        setUserApplications(applications.map(a => a.agency_id))
      }
    }

    // Fetch all agencies with member count
    const { data, error } = await supabase
      .from('agencies')
      .select(`
        id, name, slug, description, logo_url, tagline, is_public, is_accepting_members, primary_color,
        agency_members(count)
      `)
      .eq('status', 'active')
      .order('name')

    if (!error && data) {
      const agenciesWithCount = data.map(agency => ({
        ...agency,
        is_accepting_members: agency.is_accepting_members || false,
        member_count: agency.agency_members?.[0]?.count || 0
      }))
      setAgencies(agenciesWithCount)
    }
    setLoading(false)
  }

  async function applyToAgency(agencyId: string, e: React.MouseEvent) {
    e.preventDefault() // Prevent navigating to agency page
    e.stopPropagation()
    
    if (!currentUserId) return
    
    setApplyingTo(agencyId)
    
    const { error } = await supabase
      .from('agency_applications')
      .insert({
        agency_id: agencyId,
        recruiter_id: currentUserId,
        status: 'pending'
      })

    if (error) {
      if (error.code === '23505') {
        alert('You have already applied to this agency')
      } else {
        alert('Error submitting application: ' + error.message)
      }
    } else {
      setUserApplications([...userApplications, agencyId])
    }
    
    setApplyingTo(null)
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">{agencies.length}</div>
            <div className="text-sm text-gray-500">Total Agencies</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-gray-900">
              {agencies.reduce((sum, a) => sum + (a.member_count || 0), 0)}
            </div>
            <div className="text-sm text-gray-500">Total Members</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-green-600">
              {agencies.filter(a => a.is_accepting_members).length}
            </div>
            <div className="text-sm text-gray-500">Accepting Members</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="text-3xl font-bold text-brand-green">Free</div>
            <div className="text-sm text-gray-500">To Create Your Own</div>
          </div>
        </div>

        {/* Agencies List */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : filteredAgencies.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">
              {searchQuery ? `No agencies found matching "${searchQuery}"` : 'No agencies yet'}
            </p>
            <Link href="/agencies/create" className="text-brand-accent hover:underline">
              Be the first to create one →
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="divide-y divide-gray-100">
              {filteredAgencies.map((agency) => (
                <Link
                  key={agency.id}
                  href={`/agencies/${agency.slug}`}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors group"
                >
                  {/* Logo/Avatar */}
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: agency.primary_color || '#1B2B4B' }}
                  >
                    {agency.logo_url ? (
                      <img 
                        src={agency.logo_url} 
                        alt={agency.name} 
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <span className="text-white text-sm font-bold">
                        {agency.name.substring(0, 2).toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="w-48 flex-shrink-0">
                    <h3 className="font-medium text-gray-900 group-hover:text-brand-accent transition-colors truncate">
                      {agency.name}
                    </h3>
                    {agency.tagline && (
                      <p className="text-xs text-gray-500 truncate">{agency.tagline}</p>
                    )}
                  </div>

                  {/* Members */}
                  <div className="w-24 flex-shrink-0 hidden md:block">
                    <div className="flex items-center gap-1 text-sm text-gray-500">
                      <Users className="w-4 h-4" />
                      {agency.member_count}
                    </div>
                  </div>

                  {/* Badges */}
                  <div className="flex-1 hidden lg:flex items-center gap-2">
                    {agency.is_public ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                        <Globe className="w-3 h-3" />
                        Public
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                        <Lock className="w-3 h-3" />
                        Private
                      </span>
                    )}
                    {agency.is_accepting_members ? (
                      <span className="flex items-center gap-1 text-xs text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                        <UserPlus className="w-3 h-3" />
                        Accepting
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        Not Accepting
                      </span>
                    )}
                  </div>

                  {/* Action/Status */}
                  <div className="flex-shrink-0">
                    {currentUserId && userMemberships.includes(agency.id) ? (
                      <span className="flex items-center gap-1 text-xs text-green-600 bg-green-50 px-2.5 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        Member
                      </span>
                    ) : currentUserId && userApplications.includes(agency.id) ? (
                      <span className="flex items-center gap-1 text-xs text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        <Check className="w-3 h-3" />
                        Applied
                      </span>
                    ) : agency.is_accepting_members ? (
                      <button
                        onClick={(e) => applyToAgency(agency.id, e)}
                        disabled={applyingTo === agency.id}
                        className="flex items-center gap-1 text-xs text-brand-accent bg-blue-50 px-2.5 py-1 rounded-full hover:bg-blue-100 transition-colors"
                      >
                        {applyingTo === agency.id ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : (
                          <UserPlus className="w-3 h-3" />
                        )}
                        Join
                      </button>
                    ) : null}
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
