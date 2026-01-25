'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  ArrowLeft, Building, Users, Settings, UserPlus, Trash2, Check, X,
  Plus, Loader2, Globe, Lock, Mail, Clock, MapPin, Briefcase, ExternalLink
} from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  tagline: string | null
  is_public: boolean
  is_accepting_members: boolean
  website: string | null
  email: string | null
  phone: string | null
  primary_color: string
  secondary_color: string
  owner_id: string
}

interface Member {
  id: string
  role: string
  status: string
  recruiter_id: string
  team_id: string | null
  recruiter: {
    id: string
    full_name: string | null
    email: string
  }
}

interface Application {
  id: string
  agency_id: string
  recruiter_id: string
  status: string
  message: string | null
  created_at: string
  recruiter: {
    id: string
    full_name: string | null
    email: string
    city: string | null
    state_province: string | null
    country: string | null
    specializations: string[] | null
    bio: string | null
    is_available: boolean
  } | null
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

interface Team {
  id: string
  name: string
  description: string | null
  specialization: string | null
}

export default function ManageAgencyPage() {
  const params = useParams()
  const router = useRouter()
  const supabase = createClient()
  
  const [agency, setAgency] = useState<Agency | null>(null)
  const [members, setMembers] = useState<Member[]>([])
  const [pendingMembers, setPendingMembers] = useState<Member[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null)
  const [selectedRecruiterStats, setSelectedRecruiterStats] = useState<RecruiterStats | null>(null)
  const [loadingStats, setLoadingStats] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'applications' | 'teams' | 'settings'>('members')
  const [processingApplication, setProcessingApplication] = useState(false)
  
  // Invite modal
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviting, setInviting] = useState(false)
  
  // Team modal
  const [showTeamModal, setShowTeamModal] = useState(false)
  const [teamForm, setTeamForm] = useState({ name: '', description: '', specialization: '' })
  const [savingTeam, setSavingTeam] = useState(false)

  // Settings form
  const [settingsForm, setSettingsForm] = useState({
    name: '',
    tagline: '',
    description: '',
    is_public: true,
    is_accepting_members: true,
    website: '',
    email: '',
    phone: '',
    primary_color: '#1B2B4B',
    secondary_color: '#10B981'
  })
  const [savingSettings, setSavingSettings] = useState(false)

  useEffect(() => {
    if (params.slug) {
      fetchAgency(params.slug as string)
    }
  }, [params.slug])

  async function fetchAgency(slug: string) {
    // Verify ownership
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      router.push('/agencies')
      return
    }

    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id')
      .eq('id', user.id)
      .single()

    if (!recruiter) {
      router.push('/agencies')
      return
    }

    // Fetch agency
    const { data: agencyData, error } = await supabase
      .from('agencies')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error || !agencyData || agencyData.owner_id !== recruiter.id) {
      router.push('/agencies')
      return
    }

    setAgency(agencyData)
    setSettingsForm({
      name: agencyData.name,
      tagline: agencyData.tagline || '',
      description: agencyData.description || '',
      is_public: agencyData.is_public,
      is_accepting_members: agencyData.is_accepting_members || false,
      website: agencyData.website || '',
      email: agencyData.email || '',
      phone: agencyData.phone || '',
      primary_color: agencyData.primary_color,
      secondary_color: agencyData.secondary_color
    })

    // Fetch members
    const { data: membersData } = await supabase
      .from('agency_members')
      .select(`
        id, role, status, recruiter_id, team_id,
        recruiter:recruiters(id, full_name, email)
      `)
      .eq('agency_id', agencyData.id)
      .order('role')

    if (membersData) {
      setMembers(membersData.filter(m => m.status === 'active') as unknown as Member[])
      setPendingMembers(membersData.filter(m => m.status === 'pending') as unknown as Member[])
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

    // Fetch pending applications
    const { data: applicationsData } = await supabase
      .from('agency_applications')
      .select(`
        id, agency_id, recruiter_id, status, message, created_at,
        recruiter:recruiters(id, full_name, email, city, state_province, country, specializations, bio, is_available)
      `)
      .eq('agency_id', agencyData.id)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })

    if (applicationsData) {
      setApplications(applicationsData as unknown as Application[])
    }

    setLoading(false)
  }

  async function handleApprove(memberId: string) {
    const { error } = await supabase
      .from('agency_members')
      .update({ status: 'active' })
      .eq('id', memberId)

    if (!error) {
      fetchAgency(params.slug as string)
    }
  }

  async function handleReject(memberId: string) {
    const { error } = await supabase
      .from('agency_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      fetchAgency(params.slug as string)
    }
  }

  async function selectApplication(application: Application) {
    setSelectedApplication(application)
    setSelectedRecruiterStats(null)
    setLoadingStats(true)

    // Fetch recruiter stats
    const { data: stats } = await supabase
      .from('recruiter_stats')
      .select('*')
      .eq('recruiter_id', application.recruiter_id)
      .single()

    if (stats) {
      setSelectedRecruiterStats(stats as RecruiterStats)
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

  async function handleAcceptApplication(application: Application) {
    if (!agency) return
    setProcessingApplication(true)

    // Add as member
    const { error: memberError } = await supabase
      .from('agency_members')
      .insert({
        agency_id: agency.id,
        recruiter_id: application.recruiter_id,
        role: 'member',
        status: 'active'
      })

    if (memberError) {
      alert('Error adding member: ' + memberError.message)
      setProcessingApplication(false)
      return
    }

    // Update application status
    await supabase
      .from('agency_applications')
      .update({ status: 'approved' })
      .eq('id', application.id)

    setSelectedApplication(null)
    setSelectedRecruiterStats(null)
    setProcessingApplication(false)
    fetchAgency(params.slug as string)
  }

  async function handleDeclineApplication(application: Application) {
    if (!confirm('Are you sure you want to decline this application?')) return
    setProcessingApplication(true)

    await supabase
      .from('agency_applications')
      .update({ status: 'rejected' })
      .eq('id', application.id)

    setSelectedApplication(null)
    setSelectedRecruiterStats(null)
    setProcessingApplication(false)
    fetchAgency(params.slug as string)
  }

  async function handleRemoveMember(memberId: string) {
    if (!confirm('Are you sure you want to remove this member?')) return
    
    const { error } = await supabase
      .from('agency_members')
      .delete()
      .eq('id', memberId)

    if (!error) {
      fetchAgency(params.slug as string)
    }
  }

  async function handleInvite() {
    if (!inviteEmail || !agency) return
    setInviting(true)

    // Find recruiter by email
    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id')
      .eq('email', inviteEmail)
      .single()

    if (!recruiter) {
      alert('No recruiter found with that email')
      setInviting(false)
      return
    }

    // Check if already a member
    const { data: existing } = await supabase
      .from('agency_members')
      .select('id')
      .eq('agency_id', agency.id)
      .eq('recruiter_id', recruiter.id)
      .single()

    if (existing) {
      alert('This recruiter is already a member or has a pending request')
      setInviting(false)
      return
    }

    // Add as active member (invited by owner)
    const { error } = await supabase
      .from('agency_members')
      .insert([{
        agency_id: agency.id,
        recruiter_id: recruiter.id,
        role: 'member',
        status: 'active'
      }])

    if (error) {
      alert('Error inviting member: ' + error.message)
    } else {
      setShowInviteModal(false)
      setInviteEmail('')
      fetchAgency(params.slug as string)
    }
    setInviting(false)
  }

  async function handleCreateTeam() {
    if (!teamForm.name || !agency) return
    setSavingTeam(true)

    const { error } = await supabase
      .from('agency_teams')
      .insert([{
        agency_id: agency.id,
        name: teamForm.name,
        description: teamForm.description || null,
        specialization: teamForm.specialization || null
      }])

    if (error) {
      alert('Error creating team: ' + error.message)
    } else {
      setShowTeamModal(false)
      setTeamForm({ name: '', description: '', specialization: '' })
      fetchAgency(params.slug as string)
    }
    setSavingTeam(false)
  }

  async function handleDeleteTeam(teamId: string) {
    if (!confirm('Are you sure you want to delete this team?')) return

    const { error } = await supabase
      .from('agency_teams')
      .delete()
      .eq('id', teamId)

    if (!error) {
      fetchAgency(params.slug as string)
    }
  }

  async function handleSaveSettings() {
    if (!agency) return
    setSavingSettings(true)

    const { error } = await supabase
      .from('agencies')
      .update({
        name: settingsForm.name,
        tagline: settingsForm.tagline || null,
        description: settingsForm.description || null,
        is_public: settingsForm.is_public,
        is_accepting_members: settingsForm.is_accepting_members,
        website: settingsForm.website || null,
        email: settingsForm.email || null,
        phone: settingsForm.phone || null,
        primary_color: settingsForm.primary_color,
        secondary_color: settingsForm.secondary_color
      })
      .eq('id', agency.id)

    if (error) {
      alert('Error saving settings: ' + error.message)
    } else {
      alert('Settings saved!')
      fetchAgency(params.slug as string)
    }
    setSavingSettings(false)
  }

  async function handleAssignTeam(memberId: string, teamId: string | null) {
    const { error } = await supabase
      .from('agency_members')
      .update({ team_id: teamId })
      .eq('id', memberId)

    if (!error) {
      fetchAgency(params.slug as string)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!agency) return null

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header style={{ backgroundColor: agency.primary_color }} className="text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href={`/agencies/${agency.slug}`} className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Agency
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-lg">
              <Settings className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Manage {agency.name}</h1>
              <p className="text-white/70">Manage members, teams, and settings</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('members')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'members' 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('applications')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'applications' 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <UserPlus className="w-4 h-4 inline mr-2" />
              Applications
              {applications.length > 0 && (
                <span className="ml-2 bg-orange-500 text-white text-xs px-2 py-0.5 rounded-full">
                  {applications.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('teams')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'teams' 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="w-4 h-4 inline mr-2" />
              Teams ({teams.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`py-4 border-b-2 font-medium text-sm ${
                activeTab === 'settings' 
                  ? 'border-brand-accent text-brand-accent' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Settings
            </button>
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Members Tab */}
        {activeTab === 'members' && (
          <div className="space-y-6">
            {/* Pending Requests */}
            {pendingMembers.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
                <h2 className="text-lg font-semibold text-yellow-800 mb-4">
                  Pending Requests ({pendingMembers.length})
                </h2>
                <div className="space-y-3">
                  {pendingMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between bg-white p-4 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {member.recruiter?.full_name?.charAt(0) || member.recruiter?.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.recruiter?.full_name || member.recruiter?.email}
                          </div>
                          <div className="text-sm text-gray-500">{member.recruiter?.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleApprove(member.id)}
                          className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                        >
                          <Check className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => handleReject(member.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Active Members */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-gray-900">Active Members</h2>
                <button
                  onClick={() => setShowInviteModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  <UserPlus className="w-4 h-4" />
                  Invite Member
                </button>
              </div>
              
              {members.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No members yet</p>
              ) : (
                <div className="space-y-3">
                  {members.map((member) => (
                    <div key={member.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-medium">
                          {member.recruiter?.full_name?.charAt(0) || member.recruiter?.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {member.recruiter?.full_name || member.recruiter?.email}
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <span className={`px-2 py-0.5 rounded ${
                              member.role === 'owner' ? 'bg-purple-100 text-purple-700' :
                              member.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {member.role}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <select
                          value={member.team_id || ''}
                          onChange={(e) => handleAssignTeam(member.id, e.target.value || null)}
                          className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg"
                        >
                          <option value="">No team</option>
                          {teams.map((team) => (
                            <option key={team.id} value={team.id}>{team.name}</option>
                          ))}
                        </select>
                        {member.role !== 'owner' && (
                          <button
                            onClick={() => handleRemoveMember(member.id)}
                            className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            {/* Selected Application Detail */}
            {selectedApplication ? (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => { setSelectedApplication(null); setSelectedRecruiterStats(null); }}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Applications
                  </button>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDeclineApplication(selectedApplication)}
                      disabled={processingApplication}
                      className="flex items-center gap-2 px-4 py-2 border border-red-200 text-red-600 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Decline
                    </button>
                    <button
                      onClick={() => handleAcceptApplication(selectedApplication)}
                      disabled={processingApplication}
                      className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {processingApplication ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4" />
                      )}
                      Accept
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {/* Recruiter Profile */}
                  <div className="flex items-start gap-6">
                    <div className="w-20 h-20 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center text-white text-2xl font-bold flex-shrink-0">
                      {selectedApplication.recruiter?.full_name?.charAt(0) || selectedApplication.recruiter?.email.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedApplication.recruiter?.full_name || selectedApplication.recruiter?.email.split('@')[0]}
                      </h2>
                      <p className="text-gray-500">{selectedApplication.recruiter?.email}</p>
                      
                      {(selectedApplication.recruiter?.city || selectedApplication.recruiter?.state_province) && (
                        <div className="flex items-center gap-1 text-gray-600 mt-2">
                          <MapPin className="w-4 h-4" />
                          {[selectedApplication.recruiter.city, selectedApplication.recruiter.state_province, selectedApplication.recruiter.country]
                            .filter(Boolean)
                            .join(', ')}
                        </div>
                      )}
                      
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`px-2.5 py-1 text-xs rounded-full font-medium ${
                          selectedApplication.recruiter?.is_available 
                            ? 'bg-green-100 text-green-700' 
                            : 'bg-gray-100 text-gray-500'
                        }`}>
                          {selectedApplication.recruiter?.is_available ? 'Available' : 'Unavailable'}
                        </span>
                        <Link 
                          href={`/recruiters/${selectedApplication.recruiter?.id}`}
                          target="_blank"
                          className="flex items-center gap-1 text-xs text-brand-accent hover:underline"
                        >
                          View Full Profile <ExternalLink className="w-3 h-3" />
                        </Link>
                      </div>
                    </div>
                  </div>
                  
                  {/* Specializations */}
                  {selectedApplication.recruiter?.specializations && selectedApplication.recruiter.specializations.length > 0 && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <Briefcase className="w-4 h-4" />
                        Specializations
                      </h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedApplication.recruiter.specializations.map((spec, index) => (
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
                    </div>
                  )}
                  
                  {/* Recruiter Stats */}
                  <div className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Performance Stats
                    </h3>
                    {loadingStats ? (
                      <div className="flex items-center gap-2 text-gray-500">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Loading stats...
                      </div>
                    ) : selectedRecruiterStats ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                          <div className="text-2xl font-bold text-green-700">
                            {formatCurrency(selectedRecruiterStats.ytd_revenue)}
                          </div>
                          <div className="text-sm text-green-600">YTD Revenue</div>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                          <div className="text-2xl font-bold text-blue-700">
                            {formatCurrency(selectedRecruiterStats.mtd_revenue)}
                          </div>
                          <div className="text-sm text-blue-600">MTD Revenue</div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
                          <div className="text-2xl font-bold text-purple-700">
                            {selectedRecruiterStats.ytd_placements}
                          </div>
                          <div className="text-sm text-purple-600">YTD Placements</div>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
                          <div className="text-2xl font-bold text-orange-700">
                            {selectedRecruiterStats.avg_time_to_fill.toFixed(1)} days
                          </div>
                          <div className="text-sm text-orange-600">Avg Time to Fill</div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                        <p className="text-gray-500 text-sm">No performance data available yet</p>
                      </div>
                    )}
                  </div>
                  
                  {/* Bio */}
                  {selectedApplication.recruiter?.bio && (
                    <div className="mt-6">
                      <h3 className="text-sm font-semibold text-gray-700 mb-3">Bio</h3>
                      <p className="text-gray-600 whitespace-pre-wrap">{selectedApplication.recruiter.bio}</p>
                    </div>
                  )}
                  
                  {/* Application Message */}
                  {selectedApplication.message && (
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <h3 className="text-sm font-semibold text-blue-800 mb-2">Application Message</h3>
                      <p className="text-blue-700">{selectedApplication.message}</p>
                    </div>
                  )}
                  
                  {/* Application Date */}
                  <div className="mt-6 text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    Applied {new Date(selectedApplication.created_at).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </div>
                </div>
              </div>
            ) : (
              /* Applications List */
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                  <h2 className="text-lg font-semibold text-gray-900">Pending Applications</h2>
                  <p className="text-sm text-gray-500">Review recruiters who want to join your agency</p>
                </div>
                
                {applications.length === 0 ? (
                  <div className="p-12 text-center">
                    <UserPlus className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No pending applications</p>
                    {!agency?.is_accepting_members && (
                      <p className="text-sm text-orange-600 mt-2">
                        Your agency is not currently accepting new members. 
                        Enable this in Settings to receive applications.
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-100">
                    {applications.map((application) => (
                      <div
                        key={application.id}
                        onClick={() => selectApplication(application)}
                        className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <div className="w-12 h-12 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0">
                          {application.recruiter?.full_name?.charAt(0) || application.recruiter?.email.charAt(0).toUpperCase()}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-gray-900">
                            {application.recruiter?.full_name || application.recruiter?.email.split('@')[0]}
                          </h3>
                          <p className="text-sm text-gray-500 truncate">{application.recruiter?.email}</p>
                        </div>
                        
                        {(application.recruiter?.city || application.recruiter?.state_province) && (
                          <div className="hidden md:flex items-center gap-1 text-sm text-gray-500">
                            <MapPin className="w-4 h-4" />
                            {application.recruiter.city}{application.recruiter.state_province && `, ${application.recruiter.state_province}`}
                          </div>
                        )}
                        
                        {application.recruiter?.specializations && application.recruiter.specializations.length > 0 && (
                          <div className="hidden lg:flex items-center gap-2">
                            {application.recruiter.specializations.slice(0, 2).map((spec, idx) => (
                              <span key={spec} className={`px-2 py-0.5 text-xs rounded-full ${
                                idx === 0 ? 'bg-teal-100 text-teal-800' : 'bg-teal-50 text-teal-700'
                              }`}>
                                {spec}
                              </span>
                            ))}
                          </div>
                        )}
                        
                        <div className="text-sm text-gray-400">
                          {new Date(application.created_at).toLocaleDateString()}
                        </div>
                        
                        <ExternalLink className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Teams</h2>
              <button
                onClick={() => setShowTeamModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-600 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Create Team
              </button>
            </div>
            
            {teams.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No teams yet. Create one to organize your members.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {teams.map((team) => (
                  <div key={team.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium text-gray-900">{team.name}</h3>
                        {team.specialization && (
                          <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 text-xs rounded-full">
                            {team.specialization}
                          </span>
                        )}
                        {team.description && (
                          <p className="text-sm text-gray-500 mt-2">{team.description}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-2">
                          {members.filter(m => m.team_id === team.id).length} members
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteTeam(team.id)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-6">Agency Settings</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
                  <input
                    type="text"
                    value={settingsForm.name}
                    onChange={(e) => setSettingsForm({ ...settingsForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={settingsForm.tagline}
                    onChange={(e) => setSettingsForm({ ...settingsForm, tagline: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={4}
                    value={settingsForm.description}
                    onChange={(e) => setSettingsForm({ ...settingsForm, description: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Visibility</label>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={settingsForm.is_public}
                        onChange={() => setSettingsForm({ ...settingsForm, is_public: true })}
                      />
                      <Globe className="w-4 h-4 text-green-500" />
                      Public
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        checked={!settingsForm.is_public}
                        onChange={() => setSettingsForm({ ...settingsForm, is_public: false })}
                      />
                      <Lock className="w-4 h-4 text-orange-500" />
                      Private
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Membership</label>
                  <label className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={settingsForm.is_accepting_members}
                      onChange={(e) => setSettingsForm({ ...settingsForm, is_accepting_members: e.target.checked })}
                      className="w-5 h-5 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                    />
                    <div>
                      <div className="flex items-center gap-2 font-medium text-gray-900">
                        <UserPlus className="w-4 h-4 text-green-500" />
                        Accepting New Members
                      </div>
                      <p className="text-sm text-gray-500">
                        Allow recruiters to request to join your agency
                      </p>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settingsForm.primary_color}
                        onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settingsForm.primary_color}
                        onChange={(e) => setSettingsForm({ ...settingsForm, primary_color: e.target.value })}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={settingsForm.secondary_color}
                        onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                        className="w-10 h-10 rounded border cursor-pointer"
                      />
                      <input
                        type="text"
                        value={settingsForm.secondary_color}
                        onChange={(e) => setSettingsForm({ ...settingsForm, secondary_color: e.target.value })}
                        className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200"
                      />
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleSaveSettings}
                  disabled={savingSettings}
                  className="px-6 py-2.5 bg-brand-green text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
                >
                  {savingSettings && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Invite Member</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Recruiter Email</label>
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                placeholder="recruiter@example.com"
              />
              <p className="text-xs text-gray-500 mt-1">The recruiter must already have an account on the platform</p>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowInviteModal(false); setInviteEmail('') }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleInvite}
                disabled={inviting || !inviteEmail}
                className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {inviting && <Loader2 className="w-4 h-4 animate-spin" />}
                Invite
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Create Team</h2>
            <div className="space-y-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Team Name *</label>
                <input
                  type="text"
                  value={teamForm.name}
                  onChange={(e) => setTeamForm({ ...teamForm, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="e.g., Tech Recruiting"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
                <input
                  type="text"
                  value={teamForm.specialization}
                  onChange={(e) => setTeamForm({ ...teamForm, specialization: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="e.g., Software Engineering, Finance"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={3}
                  value={teamForm.description}
                  onChange={(e) => setTeamForm({ ...teamForm, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="What does this team focus on?"
                />
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => { setShowTeamModal(false); setTeamForm({ name: '', description: '', specialization: '' }) }}
                className="px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateTeam}
                disabled={savingTeam || !teamForm.name}
                className="px-4 py-2 bg-brand-green text-white rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center gap-2"
              >
                {savingTeam && <Loader2 className="w-4 h-4 animate-spin" />}
                Create
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
