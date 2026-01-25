'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  ArrowLeft, Building, Users, Settings, UserPlus, Trash2, Check, X,
  Plus, Loader2, Globe, Lock, Mail
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
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'members' | 'teams' | 'settings'>('members')
  
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
