'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  ArrowLeft, Building, Users, Globe, Lock, Mail, Phone, ExternalLink,
  Settings, UserPlus, Loader2, Check, X
} from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  tagline: string | null
  is_public: boolean
  website: string | null
  email: string | null
  phone: string | null
  primary_color: string
  secondary_color: string
  owner_id: string
  status: string
}

interface Member {
  id: string
  role: string
  status: string
  joined_at: string
  recruiter: {
    id: string
    full_name: string | null
    email: string
    specializations: string[] | null
  }
  team: {
    id: string
    name: string
  } | null
}

interface Team {
  id: string
  name: string
  description: string | null
  specialization: string | null
}

export default function AgencyDetailPage() {
  const params = useParams()
  const supabase = createClient()
  const [agency, setAgency] = useState<Agency | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)
  const [isMember, setIsMember] = useState(false)
  const [currentRecruiterId, setCurrentRecruiterId] = useState<string | null>(null)
  const [requesting, setRequesting] = useState(false)

  useEffect(() => {
    if (params.slug) {
      fetchAgency(params.slug as string)
    }
  }, [params.slug])

  async function fetchAgency(slug: string) {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    let recruiterId = null
    
    if (user) {
      const { data: recruiter } = await supabase
        .from('recruiters')
        .select('id')
        .eq('id', user.id)
        .single()
      recruiterId = recruiter?.id
      setCurrentRecruiterId(recruiterId)
    }

    // Fetch agency
    const { data: agencyData, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !agencyData) {
      setLoading(false)
      return
    }

    setAgency(agencyData)
    setIsOwner(recruiterId === agencyData.owner_id)

    // Check if current user is a member
    if (recruiterId) {
      const { data: memberData } = await supabase
        .from('agency_members')
        .select('id')
        .eq('agency_id', agencyData.id)
        .eq('recruiter_id', recruiterId)
        .single()
      
      setIsMember(!!memberData)
    }

    // Fetch members
    const { data: membersData } = await supabase
      .from('agency_members')
      .select(`
        id, role, status, joined_at,
        recruiter:recruiters(id, full_name, email, specializations),
        team:agency_teams(id, name)
      `)
      .eq('agency_id', agencyData.id)
      .eq('status', 'active')
      .order('role')

    if (membersData) {
      setMembers(membersData as unknown as Member[])
    }

    // Fetch teams
    const { data: teamsData } = await supabase
      .from('agency_teams')
      .select('*')
      .eq('agency_id', agencyData.id)
      .order('name')

    if (teamsData) {
      setTeams(teamsData)
    }

    setLoading(false)
  }

  async function requestToJoin() {
    if (!currentRecruiterId || !agency) return
    
    setRequesting(true)

    const { error } = await supabase
      .from('agency_members')
      .insert([{
        agency_id: agency.id,
        recruiter_id: currentRecruiterId,
        role: 'member',
        status: 'pending'
      }])

    if (error) {
      alert('Error requesting to join: ' + error.message)
    } else {
      alert('Request sent! The agency owner will review your application.')
      setIsMember(true)
    }
    
    setRequesting(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!agency) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Building className="w-12 h-12 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 mb-4">Agency not found</p>
          <Link href="/agencies" className="text-brand-accent hover:underline">
            Back to agencies
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header 
        className="text-white"
        style={{ backgroundColor: agency.primary_color }}
      >
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/agencies" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Agencies
          </Link>
          
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="w-20 h-20 rounded-xl bg-white/20 flex items-center justify-center">
                {agency.logo_url ? (
                  <img src={agency.logo_url} alt={agency.name} className="w-16 h-16 object-contain" />
                ) : (
                  <span className="text-3xl font-bold">{agency.name.substring(0, 2).toUpperCase()}</span>
                )}
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{agency.name}</h1>
                  {agency.is_public ? (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded text-xs">
                      <Globe className="w-3 h-3" /> Public
                    </span>
                  ) : (
                    <span className="flex items-center gap-1 px-2 py-0.5 bg-white/20 rounded text-xs">
                      <Lock className="w-3 h-3" /> Private
                    </span>
                  )}
                </div>
                {agency.tagline && (
                  <p className="text-white/80 text-lg">{agency.tagline}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-3">
              {isOwner && (
                <Link
                  href={`/agencies/${agency.slug}/manage`}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 rounded-lg hover:bg-white/30 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Manage
                </Link>
              )}
              {!isMember && !isOwner && currentRecruiterId && (
                <button
                  onClick={requestToJoin}
                  disabled={requesting}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition-colors"
                  style={{ backgroundColor: agency.secondary_color }}
                >
                  {requesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {requesting ? 'Requesting...' : 'Request to Join'}
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* About */}
            {agency.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">About</h2>
                <p className="text-gray-600 leading-relaxed">{agency.description}</p>
              </div>
            )}

            {/* Teams */}
            {teams.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Teams ({teams.length})</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {teams.map((team) => (
                    <div key={team.id} className="p-4 bg-gray-50 rounded-lg">
                      <h3 className="font-medium text-gray-900">{team.name}</h3>
                      {team.specialization && (
                        <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                          {team.specialization}
                        </span>
                      )}
                      {team.description && (
                        <p className="text-sm text-gray-500 mt-2">{team.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Members */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Members ({members.length})</h2>
              {members.length === 0 ? (
                <p className="text-gray-500 text-sm">No members yet</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <Link 
                      key={member.id} 
                      href={`/recruiters/${member.recruiter?.id}`}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center text-white font-medium">
                          {member.recruiter?.full_name?.charAt(0) || member.recruiter?.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900 hover:text-brand-accent">
                            {member.recruiter?.full_name || member.recruiter?.email}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className={`px-1.5 py-0.5 rounded ${
                              member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                              member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {member.role}
                            </span>
                            {member.team && (
                              <span className="text-gray-400">• {member.team.name}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      {member.recruiter?.specializations && member.recruiter.specializations.length > 0 && (
                        <div className="flex gap-1">
                          {member.recruiter.specializations.slice(0, 2).map((spec) => (
                            <span key={spec} className="px-2 py-0.5 bg-teal-50 text-teal-700 text-xs rounded-full">
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Contact */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
              <div className="space-y-3">
                {agency.email && (
                  <a href={`mailto:${agency.email}`} className="flex items-center gap-3 text-gray-600 hover:text-brand-accent">
                    <Mail className="w-4 h-4" />
                    {agency.email}
                  </a>
                )}
                {agency.phone && (
                  <a href={`tel:${agency.phone}`} className="flex items-center gap-3 text-gray-600 hover:text-brand-accent">
                    <Phone className="w-4 h-4" />
                    {agency.phone}
                  </a>
                )}
                {agency.website && (
                  <a href={agency.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-gray-600 hover:text-brand-accent">
                    <ExternalLink className="w-4 h-4" />
                    Website
                  </a>
                )}
              </div>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Stats</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Members</span>
                  <span className="font-medium text-gray-900">{members.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Teams</span>
                  <span className="font-medium text-gray-900">{teams.length}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
