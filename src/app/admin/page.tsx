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
  Plus,
  Trash2,
  Loader2,
  X,
  Edit,
  Eye,
  EyeOff
} from 'lucide-react'

interface Recruiter {
  id: string
  email: string
  full_name: string | null
  phone: string | null
  is_admin: boolean
  is_available: boolean
  created_at: string
  city: string | null
  state_province: string | null
  country: string | null
  bio: string | null
  linkedin_url: string | null
  force_password_change: boolean
}

interface Agency {
  id: string
  name: string
  slug: string
  status: string
  is_public: boolean
  owner_id: string
  description: string | null
  website: string | null
  email: string | null
  phone: string | null
  tagline: string | null
  owner?: { full_name: string | null; email: string } | null
  member_count?: number
}

interface AgencyMember {
  recruiter_id: string
  role: string
  status: string
  recruiter: { full_name: string | null; email: string } | null
}

const usStates = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut', 'Delaware',
  'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa', 'Kansas', 'Kentucky',
  'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan', 'Minnesota', 'Mississippi',
  'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire', 'New Jersey', 'New Mexico',
  'New York', 'North Carolina', 'North Dakota', 'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania',
  'Rhode Island', 'South Carolina', 'South Dakota', 'Tennessee', 'Texas', 'Utah', 'Vermont',
  'Virginia', 'Washington', 'West Virginia', 'Wisconsin', 'Wyoming'
]

const canadianProvinces = [
  'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
  'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
  'Quebec', 'Saskatchewan', 'Yukon'
]

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
  
  // Modals
  const [showRecruiterModal, setShowRecruiterModal] = useState(false)
  const [showAgencyModal, setShowAgencyModal] = useState(false)
  const [editingRecruiter, setEditingRecruiter] = useState<Recruiter | null>(null)
  
  // Form states
  const [recruiterForm, setRecruiterForm] = useState({
    email: '',
    full_name: '',
    phone: '',
    city: '',
    state_province: '',
    country: '',
    bio: '',
    linkedin_url: '',
    is_admin: false,
    is_available: true
  })
  
  const [agencyForm, setAgencyForm] = useState({
    name: '',
    slug: '',
    description: '',
    owner_id: '',
    is_public: false,
    website: '',
    email: '',
    phone: '',
    tagline: ''
  })
  
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
      .select('*')
      .order('created_at', { ascending: false })

    if (data) setRecruiters(data)
  }

  async function fetchAgencies() {
    const { data } = await supabase
      .from('agencies')
      .select(`
        *,
        owner:recruiters!owner_id(full_name, email),
        agency_members(count)
      `)
      .order('name')

    if (data) {
      const agenciesWithCount = data.map((a: any) => ({
        ...a,
        owner: Array.isArray(a.owner) ? a.owner[0] : a.owner,
        member_count: a.agency_members?.[0]?.count || 0
      }))
      setAgencies(agenciesWithCount)
    }
  }

  async function handleCreateRecruiter() {
    if (!recruiterForm.email) {
      alert('Email is required')
      return
    }
    
    setSaving(true)
    
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_recruiter',
        ...recruiterForm
      })
    })
    
    const result = await res.json()
    
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      alert('Recruiter created successfully!\nDefault password: h3ll0Th3r3')
      setShowRecruiterModal(false)
      resetRecruiterForm()
      fetchRecruiters()
    }
    
    setSaving(false)
  }

  async function handleUpdateRecruiter() {
    if (!editingRecruiter) return
    
    setSaving(true)
    
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'update_recruiter',
        recruiter_id: editingRecruiter.id,
        full_name: recruiterForm.full_name || null,
        phone: recruiterForm.phone || null,
        city: recruiterForm.city || null,
        state_province: recruiterForm.state_province || null,
        country: recruiterForm.country || null,
        bio: recruiterForm.bio || null,
        linkedin_url: recruiterForm.linkedin_url || null,
        is_admin: recruiterForm.is_admin,
        is_available: recruiterForm.is_available
      })
    })
    
    const result = await res.json()
    
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      setShowRecruiterModal(false)
      setEditingRecruiter(null)
      resetRecruiterForm()
      fetchRecruiters()
    }
    
    setSaving(false)
  }

  async function handleDeleteRecruiter(recruiter: Recruiter) {
    if (!confirm(`Are you sure you want to delete ${recruiter.email}? This cannot be undone.`)) {
      return
    }
    
    setSaving(true)
    
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_recruiter',
        recruiter_id: recruiter.id
      })
    })
    
    const result = await res.json()
    
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      fetchRecruiters()
    }
    
    setSaving(false)
  }

  async function handleCreateAgency() {
    if (!agencyForm.name || !agencyForm.slug || !agencyForm.owner_id) {
      alert('Name, slug, and owner are required')
      return
    }
    
    setSaving(true)
    
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_agency',
        ...agencyForm
      })
    })
    
    const result = await res.json()
    
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      setShowAgencyModal(false)
      resetAgencyForm()
      fetchAgencies()
    }
    
    setSaving(false)
  }

  async function handleDeleteAgency(agency: Agency) {
    if (!confirm(`Are you sure you want to delete "${agency.name}"? This will also remove all members. This cannot be undone.`)) {
      return
    }
    
    setSaving(true)
    
    const res = await fetch('/api/admin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'delete_agency',
        agency_id: agency.id
      })
    })
    
    const result = await res.json()
    
    if (result.error) {
      alert('Error: ' + result.error)
    } else {
      fetchAgencies()
      if (selectedAgency?.id === agency.id) {
        setSelectedAgency(null)
      }
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

    const existing = agencyMembers.find(m => m.recruiter_id === recruiter.id)
    if (existing) {
      alert('This recruiter is already a member of this agency')
      setSaving(false)
      return
    }

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

  function resetRecruiterForm() {
    setRecruiterForm({
      email: '',
      full_name: '',
      phone: '',
      city: '',
      state_province: '',
      country: '',
      bio: '',
      linkedin_url: '',
      is_admin: false,
      is_available: true
    })
  }

  function resetAgencyForm() {
    setAgencyForm({
      name: '',
      slug: '',
      description: '',
      owner_id: '',
      is_public: false,
      website: '',
      email: '',
      phone: '',
      tagline: ''
    })
  }

  function openEditRecruiter(recruiter: Recruiter) {
    setEditingRecruiter(recruiter)
    setRecruiterForm({
      email: recruiter.email,
      full_name: recruiter.full_name || '',
      phone: recruiter.phone || '',
      city: recruiter.city || '',
      state_province: recruiter.state_province || '',
      country: recruiter.country || '',
      bio: recruiter.bio || '',
      linkedin_url: recruiter.linkedin_url || '',
      is_admin: recruiter.is_admin,
      is_available: recruiter.is_available
    })
    setShowRecruiterModal(true)
  }

  function generateSlug(name: string) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
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
        {/* Search & Add */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder={`Search ${activeTab}...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
          {activeTab === 'recruiters' && (
            <button
              onClick={() => { resetRecruiterForm(); setEditingRecruiter(null); setShowRecruiterModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white rounded-lg hover:bg-green-600"
            >
              <Plus className="w-4 h-4" />
              Add Recruiter
            </button>
          )}
          {activeTab === 'agencies' && !selectedAgency && (
            <button
              onClick={() => { resetAgencyForm(); setShowAgencyModal(true); }}
              className="flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white rounded-lg hover:bg-green-600"
            >
              <Plus className="w-4 h-4" />
              Add Agency
            </button>
          )}
        </div>

        {/* Recruiters Tab */}
        {activeTab === 'recruiters' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Recruiter</th>
                  <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Location</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Admin</th>
                  <th className="text-center px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredRecruiters.map((recruiter) => (
                  <tr key={recruiter.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-gray-900">{recruiter.full_name || 'No name'}</div>
                        <div className="text-sm text-gray-500">{recruiter.email}</div>
                        {recruiter.force_password_change && (
                          <span className="text-xs text-orange-600">Must change password</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {recruiter.city && recruiter.country 
                        ? `${recruiter.city}, ${recruiter.country}`
                        : '--'
                      }
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        recruiter.is_available
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {recruiter.is_available ? 'Available' : 'Unavailable'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                        recruiter.is_admin
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {recruiter.is_admin ? 'Admin' : 'User'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => openEditRecruiter(recruiter)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                          title="Edit"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecruiter(recruiter)}
                          disabled={saving}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRecruiters.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No recruiters found
              </div>
            )}
          </div>
        )}

        {/* Agencies Tab - List */}
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
                        <div className="text-sm text-gray-500 flex items-center gap-2">
                          {agency.slug}
                          {agency.is_public ? (
                            <Eye className="w-3 h-3 text-green-500" title="Public" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-gray-400" title="Private" />
                          )}
                        </div>
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
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => loadAgencyMembers(agency)}
                          className="text-brand-accent hover:underline text-sm"
                        >
                          Manage
                        </button>
                        <button
                          onClick={() => handleDeleteAgency(agency)}
                          disabled={saving}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredAgencies.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No agencies found
              </div>
            )}
          </div>
        )}

        {/* Agencies Tab - Manage Members */}
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

      {/* Recruiter Modal */}
      {showRecruiterModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRecruiter ? 'Edit Recruiter' : 'Add New Recruiter'}
              </h2>
              <button
                onClick={() => { setShowRecruiterModal(false); setEditingRecruiter(null); }}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {!editingRecruiter && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-sm text-blue-800">
                    <strong>Default Password:</strong> h3ll0Th3r3<br />
                    The recruiter will be required to change this on first login.
                  </p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={recruiterForm.email}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, email: e.target.value })}
                    disabled={!!editingRecruiter}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-gray-100"
                    placeholder="recruiter@example.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                  <input
                    type="text"
                    value={recruiterForm.full_name}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, full_name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="John Smith"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={recruiterForm.phone}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                  <select
                    value={recruiterForm.country}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, country: e.target.value, state_province: '' })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="">Select Country</option>
                    <option value="United States">United States</option>
                    <option value="Canada">Canada</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {recruiterForm.country === 'Canada' ? 'Province' : 'State'}
                  </label>
                  <select
                    value={recruiterForm.state_province}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, state_province: e.target.value })}
                    disabled={!recruiterForm.country}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent disabled:bg-gray-100"
                  >
                    <option value="">Select {recruiterForm.country === 'Canada' ? 'Province' : 'State'}</option>
                    {recruiterForm.country === 'Canada' 
                      ? canadianProvinces.map(p => <option key={p} value={p}>{p}</option>)
                      : usStates.map(s => <option key={s} value={s}>{s}</option>)
                    }
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={recruiterForm.city}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, city: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="City"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn URL</label>
                  <input
                    type="url"
                    value={recruiterForm.linkedin_url}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, linkedin_url: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    rows={3}
                    value={recruiterForm.bio}
                    onChange={(e) => setRecruiterForm({ ...recruiterForm, bio: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Brief description..."
                  />
                </div>
                
                <div className="col-span-2 flex items-center gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recruiterForm.is_admin}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, is_admin: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="text-sm text-gray-700">Admin Access</span>
                  </label>
                  
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={recruiterForm.is_available}
                      onChange={(e) => setRecruiterForm({ ...recruiterForm, is_available: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="text-sm text-gray-700">Available for Collaboration</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => { setShowRecruiterModal(false); setEditingRecruiter(null); }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={editingRecruiter ? handleUpdateRecruiter : handleCreateRecruiter}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-blue disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editingRecruiter ? 'Update Recruiter' : 'Create Recruiter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Agency Modal */}
      {showAgencyModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-900">Add New Agency</h2>
              <button
                onClick={() => setShowAgencyModal(false)}
                className="p-2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name *</label>
                  <input
                    type="text"
                    value={agencyForm.name}
                    onChange={(e) => {
                      setAgencyForm({ 
                        ...agencyForm, 
                        name: e.target.value,
                        slug: agencyForm.slug || generateSlug(e.target.value)
                      })
                    }}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Agency Name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">URL Slug *</label>
                  <input
                    type="text"
                    value={agencyForm.slug}
                    onChange={(e) => setAgencyForm({ ...agencyForm, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="agency-slug"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Owner *</label>
                  <select
                    value={agencyForm.owner_id}
                    onChange={(e) => setAgencyForm({ ...agencyForm, owner_id: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="">Select Owner</option>
                    {recruiters.map(r => (
                      <option key={r.id} value={r.id}>
                        {r.full_name || r.email}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                  <input
                    type="text"
                    value={agencyForm.tagline}
                    onChange={(e) => setAgencyForm({ ...agencyForm, tagline: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Short tagline"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={agencyForm.website}
                    onChange={(e) => setAgencyForm({ ...agencyForm, website: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="https://..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={agencyForm.email}
                    onChange={(e) => setAgencyForm({ ...agencyForm, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="contact@agency.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={agencyForm.phone}
                    onChange={(e) => setAgencyForm({ ...agencyForm, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="(555) 123-4567"
                  />
                </div>
                
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    rows={3}
                    value={agencyForm.description}
                    onChange={(e) => setAgencyForm({ ...agencyForm, description: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Agency description..."
                  />
                </div>
                
                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={agencyForm.is_public}
                      onChange={(e) => setAgencyForm({ ...agencyForm, is_public: e.target.checked })}
                      className="w-4 h-4 rounded border-gray-300 text-brand-accent focus:ring-brand-accent"
                    />
                    <span className="text-sm text-gray-700">Public Agency (visible to all)</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-100 flex justify-end gap-3">
              <button
                onClick={() => setShowAgencyModal(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateAgency}
                disabled={saving}
                className="flex items-center gap-2 px-6 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-blue disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Create Agency
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
