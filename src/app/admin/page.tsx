'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { 
  ArrowLeft, 
  Shield, 
  Users, 
  Building, 
  Search, 
  Check, 
  X, 
  UserCog,
  Mail,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  Loader2
} from 'lucide-react'

interface Recruiter {
  id: string
  email: string
  full_name: string | null
  is_admin: boolean
  created_at: string
  city: string | null
  country: string | null
}

interface Agency {
  id: string
  name: string
  slug: string
  status: string
  is_public: boolean
  owner_id: string
  owner?: { full_name: string | null; email: string } | null
  member_count?: number
}

interface AgencyMember {
  recruiter_id: string
  role: string
  status: string
  recruiter: { full_name: string | null; email: string } | null
}

export default function AdminPage() {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'recruiters' | 'agencies'>('recruiters')
  const [recruiters, setRecruiters] = useState<Recruiter[]>([])
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedAgency, setSelectedAgency] = useState<Agency | null>(null)
  const [agencyMembers, setAgencyMembers] = useState<AgencyMember[]>([])
  const [showAddMember, setShowAddMember] = useState(false)
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [saving, setSaving] = useState(false)
  
  const supabase = createClient()

  useEffect(() => {
    checkAdmin()
  }, [])

  useEffect(() => {
    if (isAdmin) {
      fetchRecruiters()
      fetchAgencies()
    }
  }, [isAdmin])

  async function checkAdmin() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      setIsAdmin(false)
      setLoading(false)
      return
    }

    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('is_admin')
      .eq('id', user.id)
      .single()

    setIsAdmin(recruiter?.is_admin || false)
    setLoading(false)
  }

  async function fetchRecruiters() {
    const { data } = await supabase
      .from('recruiters')
      .select('id, email, full_name, is_admin, created_at, city, country')
      .order('created_at', { ascending: false })

    if (data) setRecruiters(data)
  }

  async function fetchAgencies() {
    const { data } = await supabase
      .from('agencies')
      .select(`
        id, name, slug, status, is_public, owner_id,
        owner:recruiters!owner_id(full_name, email),
        agency_members(count)
      `)
      .order('name')

    if (data) {
      const agenciesWithCount = data.map((a: any) => ({
        id: a.id,
        name: a.name,
        slug: a.slug,
        status: a.status,
        is_public: a.is_public,
        owner_id: a.owner_id,
        owner: Array.isArray(a.owner) ? a.owner[0] : a.owner,
        member_count: a.agency_members?.[0]?.count || 0
      }))
      setAgencies(agenciesWithCount)
    }
  }

  async function toggleAdmin(recruiterId: string, currentStatus: boolean) {
    setSaving(true)
    const { error } = await supabase
      .from('recruiters')
      .update({ is_admin: !currentStatus })
      .eq('id', recruiterId)

    if (!error) {
      setRecruiters(recruiters.map(r => 
        r.id === recruiterId ? { ...r, is_admin: !currentStatus } : r
      ))
    }
    setSaving(false)
  }

  async function toggleAgencyStatus(agencyId: string, currentStatus: string) {
    setSaving(true)
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    const { error } = await supabase
      .from('agencies')
      .update({ status: newStatus })
      .eq('id', agencyId)

    if (!error) {
      setAgencies(agencies.map(a => 
        a.id === agencyId ? { ...a, status: newStatus } : a
      ))
      if (selectedAgency?.id === agencyId) {
        setSelectedAgency({ ...selectedAgency, status: newStatus })
      }
    }
    setSaving(false)
  }

  async function loadAgencyMembers(agency: Agency) {
    setSelectedAgency(agency)
    const { data } = await supabase
      .from('agency_members')
      .select('recruiter_id, role, status, recruiter:recruiters(full_name, email)')
      .eq('agency_id', agency.id)

    if (data) {
      const members = data.map((m: any) => ({
        recruiter_id: m.recruiter_id,
        role: m.role,
        status: m.status,
        recruiter: Array.isArray(m.recruiter) ? m.recruiter[0] : m.recruiter
      }))
      setAgencyMembers(members)
    }
  }

  async function addMemberToAgency() {
    if (!selectedAgency || !newMemberEmail) return
    setSaving(true)

    // Find recruiter by email
    const { data: recruiter } = await supabase
      .from('recruiters')
      .select('id')
      .eq('email', newMemberEmail.toLowerCase())
      .single()

    if (!recruiter) {
      alert('Recruiter not found with that email')
      setSaving(false)
      return
    }

    // Check if already a member
    const existing = agencyMembers.find(m => m.recruiter_id === recruiter.id)
    if (existing) {
      alert('This recruiter is already a member of this agency')
      setSaving(false)
      return
    }

    // Add member
    const { error } = await supabase
      .from('agency_members')
      .insert({
        agency_id: selectedAgency.id,
        recruiter_id: recruiter.id,
        role: 'member',
        status: 'active'
      })

    if (!error) {
      loadAgencyMembers(selectedAgency)
      setNewMemberEmail('')
      setShowAddMember(false)
    } else {
      alert('Error adding member: ' + error.message)
    }
    setSaving(false)
  }

  async function removeMemberFromAgency(recruiterId: string) {
    if (!selectedAgency) return
    if (!confirm('Remove this member from the agency?')) return

    setSaving(true)
    const { error } = await supabase
      .from('agency_members')
      .delete()
      .eq('agency_id', selectedAgency.id)
      .eq('recruiter_id', recruiterId)

    if (!error) {
      setAgencyMembers(agencyMembers.filter(m => m.recruiter_id !== recruiterId))
    }
    setSaving(false)
  }

  async function changeMemberRole(recruiterId: string, newRole: string) {
    if (!selectedAgency) return
    setSaving(true)

    const { error } = await supabase
      .from('agency_members')
      .update({ role: newRole })
      .eq('agency_id', selectedAgency.id)
      .eq('recruiter_id', recruiterId)

    if (!error) {
      setAgencyMembers(agencyMembers.map(m => 
        m.recruiter_id === recruiterId ? { ...m, role: newRole } : m
      ))
    }
    setSaving(false)
  }

  const filteredRecruiters = recruiters.filter(r =>
    r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.full_name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const filteredAgencies = agencies.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-16 h-16 text-red-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h1>
          <p className="text-gray-500 mb-6">You don't have permission to access this page.</p>
          <Link href="/" className="text-brand-accent hover:underline">
            Return to Hub
          </Link>
        </div>
      </div>
    )
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
            <div className="p-3 bg-red-500 rounded-lg">
              <Shield className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Administration</h1>
              <p className="text-white/70">Manage recruiters, agencies, and platform settings</p>
            </div>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => { setActiveTab('recruiters'); setSelectedAgency(null); setSearchQuery(''); }}
              className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'recruiters'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Users className="w-4 h-4" />
              Recruiters ({recruiters.length})
            </button>
            <button
              onClick={() => { setActiveTab('agencies'); setSelectedAgency(null); setSearchQuery(''); }}
              className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'agencies'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <Building className="w-4 h-4" />
              Agencies ({agencies.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        </div>

        {activeTab === 'recruiters' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Recruiter</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Joined</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Admin</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecruiters.map((recruiter) => (
                  <tr key={recruiter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{recruiter.full_name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{recruiter.email}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {recruiter.city && recruiter.country 
                        ? `${recruiter.city}, ${recruiter.country}`
                        : '--'
                      }
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {new Date(recruiter.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleAdmin(recruiter.id, recruiter.is_admin)}
                        disabled={saving}
                        className={`p-2 rounded-lg transition-colors ${
                          recruiter.is_admin
                            ? 'bg-green-100 text-green-600 hover:bg-green-200'
                            : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                        }`}
                      >
                        {recruiter.is_admin ? (
                          <ToggleRight className="w-5 h-5" />
                        ) : (
                          <ToggleLeft className="w-5 h-5" />
                        )}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'agencies' && !selectedAgency && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Agency</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Owner</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Members</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredAgencies.map((agency) => (
                  <tr key={agency.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{agency.name}</div>
                        <div className="text-sm text-gray-500">{agency.is_public ? 'Public' : 'Private'}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {agency.owner?.full_name || agency.owner?.email || '--'}
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">
                      {agency.member_count}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => toggleAgencyStatus(agency.id, agency.status)}
                        disabled={saving}
                        className={`px-3 py-1 rounded-full text-xs font-medium ${
                          agency.status === 'active'
                            ? 'bg-green-100 text-green-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {agency.status}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => loadAgencyMembers(agency)}
                        className="text-brand-accent hover:underline text-sm"
                      >
                        Manage Members
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'agencies' && selectedAgency && (
          <div>
            <button
              onClick={() => setSelectedAgency(null)}
              className="mb-4 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to all agencies
            </button>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{selectedAgency.name}</h2>
                  <p className="text-sm text-gray-500">
                    Owner: {selectedAgency.owner?.full_name || selectedAgency.owner?.email}
                  </p>
                </div>
                <button
                  onClick={() => toggleAgencyStatus(selectedAgency.id, selectedAgency.status)}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${
                    selectedAgency.status === 'active'
                      ? 'bg-red-100 text-red-700 hover:bg-red-200'
                      : 'bg-green-100 text-green-700 hover:bg-green-200'
                  }`}
                >
                  {selectedAgency.status === 'active' ? 'Disable Agency' : 'Enable Agency'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Members ({agencyMembers.length})</h3>
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-brand-green text-white rounded-lg text-sm hover:bg-green-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Member
                </button>
              </div>

              {showAddMember && (
                <div className="p-4 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <input
                      type="email"
                      placeholder="Enter recruiter email"
                      value={newMemberEmail}
                      onChange={(e) => setNewMemberEmail(e.target.value)}
                      className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                    <button
                      onClick={addMemberToAgency}
                      disabled={saving || !newMemberEmail}
                      className="px-4 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-blue disabled:opacity-50"
                    >
                      {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Add'}
                    </button>
                    <button
                      onClick={() => { setShowAddMember(false); setNewMemberEmail(''); }}
                      className="px-4 py-2 text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Member</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {agencyMembers.map((member) => (
                    <tr key={member.recruiter_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium text-gray-900">{member.recruiter?.full_name || 'No name'}</div>
                          <div className="text-sm text-gray-500">{member.recruiter?.email}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <select
                          value={member.role}
                          onChange={(e) => changeMemberRole(member.recruiter_id, e.target.value)}
                          disabled={saving}
                          className="px-3 py-1 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-accent"
                        >
                          <option value="owner">Owner</option>
                          <option value="admin">Admin</option>
                          <option value="member">Member</option>
                        </select>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          member.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                        }`}>
                          {member.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => removeMemberFromAgency(member.recruiter_id)}
                          disabled={saving}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                  {agencyMembers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                        No members yet
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
