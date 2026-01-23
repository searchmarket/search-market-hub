'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Building, Plus, Users, Globe, Lock, Crown, Settings } from 'lucide-react'

interface AgencyMembership {
  id: string
  role: string
  status: string
  agency: {
    id: string
    name: string
    slug: string
    description: string | null
    logo_url: string | null
    tagline: string | null
    is_public: boolean
    primary_color: string
    owner_id: string
  }
}

export default function MyAgenciesPage() {
  const [memberships, setMemberships] = useState<AgencyMembership[]>([])
  const [loading, setLoading] = useState(true)
  const [currentRecruiterId, setCurrentRecruiterId] = useState<string | null>(null)
  const supabase = createClient()

  useEffect(() => {
    fetchMyAgencies()
  }, [])

  async function fetchMyAgencies() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setLoading(false)
      return
    }

    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!recruiter) {
      setLoading(false)
      return
    }

    setCurrentRecruiterId(recruiter.id)

    const { data, error } = await supabase
      .from('agency_members')
      .select(`
        id, role, status,
        agency:agencies(id, name, slug, description, logo_url, tagline, is_public, primary_color, owner_id)
      `)
      .eq('recruiter_id', recruiter.id)
      .order('role')

    if (!error && data) {
      setMemberships(data as unknown as AgencyMembership[])
    }
    setLoading(false)
  }

  const ownedAgencies = memberships.filter(m => m.role === 'owner' && m.status === 'active')
  const memberAgencies = memberships.filter(m => m.role !== 'owner' && m.status === 'active')
  const pendingAgencies = memberships.filter(m => m.status === 'pending')

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/agencies" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to All Agencies
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500 rounded-lg">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">My Agencies</h1>
                <p className="text-white/70">Agencies you own or belong to</p>
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
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : memberships.length === 0 ? (
          <div className="text-center py-12">
            <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">You're not part of any agencies yet</p>
            <div className="flex items-center justify-center gap-4 mt-4">
              <Link href="/agencies/create" className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-600">
                Create Your Own
              </Link>
              <Link href="/agencies" className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                Browse Agencies
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Owned Agencies */}
            {ownedAgencies.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Crown className="w-5 h-5 text-yellow-500" />
                  Agencies You Own ({ownedAgencies.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {ownedAgencies.map((membership) => (
                    <div
                      key={membership.id}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
                    >
                      <div 
                        className="h-16 flex items-center justify-center"
                        style={{ backgroundColor: membership.agency.primary_color }}
                      >
                        {membership.agency.logo_url ? (
                          <img src={membership.agency.logo_url} alt="" className="h-10 object-contain" />
                        ) : (
                          <span className="text-white text-xl font-bold">
                            {membership.agency.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{membership.agency.name}</h3>
                          {membership.agency.is_public ? (
                            <Globe className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-orange-500" />
                          )}
                        </div>
                        {membership.agency.tagline && (
                          <p className="text-sm text-gray-500 mb-3 line-clamp-1">{membership.agency.tagline}</p>
                        )}
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/agencies/${membership.agency.slug}`}
                            className="flex-1 px-3 py-2 text-center text-sm border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                          >
                            View
                          </Link>
                          <Link
                            href={`/agencies/${membership.agency.slug}/manage`}
                            className="flex items-center justify-center px-3 py-2 text-sm bg-brand-navy text-white rounded-lg hover:bg-brand-blue transition-colors"
                          >
                            <Settings className="w-4 h-4" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Member Agencies */}
            {memberAgencies.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-500" />
                  Agencies You Belong To ({memberAgencies.length})
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {memberAgencies.map((membership) => (
                    <Link
                      key={membership.id}
                      href={`/agencies/${membership.agency.slug}`}
                      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all"
                    >
                      <div 
                        className="h-16 flex items-center justify-center"
                        style={{ backgroundColor: membership.agency.primary_color }}
                      >
                        {membership.agency.logo_url ? (
                          <img src={membership.agency.logo_url} alt="" className="h-10 object-contain" />
                        ) : (
                          <span className="text-white text-xl font-bold">
                            {membership.agency.name.substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-gray-900">{membership.agency.name}</h3>
                          <span className={`px-2 py-0.5 text-xs rounded ${
                            membership.role === 'admin' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {membership.role}
                          </span>
                        </div>
                        {membership.agency.tagline && (
                          <p className="text-sm text-gray-500 line-clamp-1">{membership.agency.tagline}</p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Pending Requests */}
            {pendingAgencies.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Pending Requests ({pendingAgencies.length})
                </h2>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                  {pendingAgencies.map((membership) => (
                    <div key={membership.id} className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm"
                          style={{ backgroundColor: membership.agency.primary_color }}
                        >
                          {membership.agency.name.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{membership.agency.name}</div>
                          <div className="text-sm text-yellow-600">Awaiting approval</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
