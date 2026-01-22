'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { countries, provinces } from '@/lib/location-data'
import { 
  Plus, Search, Users, MoreVertical, Pencil, Trash2, X, Mail, Phone, 
  MapPin, Briefcase, Linkedin, Github, Facebook, Instagram, ArrowLeft,
  FileText, UserPlus
} from 'lucide-react'

interface Job {
  id: string
  title: string
  clients: { company_name: string } | null
}

interface Application {
  id: string
  stage: string
  job_id: string
  jobs: Job
}

interface Candidate {
  id: string
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  linkedin_url: string | null
  github_url: string | null
  facebook_url: string | null
  instagram_url: string | null
  city: string | null
  state: string | null
  country: string | null
  current_title: string | null
  current_company: string | null
  years_experience: number | null
  skills: string[] | null
  notes: string | null
  source: string | null
  status: string
  created_at: string
}

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([])
  const [jobs, setJobs] = useState<Job[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailView, setShowDetailView] = useState(false)
  const [showAddToJobModal, setShowAddToJobModal] = useState(false)
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null)
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    github_url: '',
    facebook_url: '',
    instagram_url: '',
    city: '',
    state: '',
    country: 'CA',
    current_title: '',
    current_company: '',
    years_experience: '',
    skills: '',
    notes: '',
    source: '',
    status: 'active'
  })

  const availableProvinces = provinces[formData.country] || []

  useEffect(() => {
    fetchCandidates()
    fetchJobs()
  }, [])

  useEffect(() => {
    if (formData.state && !availableProvinces.find(p => p.code === formData.state)) {
      setFormData(prev => ({ ...prev, state: '' }))
    }
  }, [formData.country])

  useEffect(() => {
    if (selectedCandidate) {
      fetchApplicationsForCandidate(selectedCandidate.id)
    }
  }, [selectedCandidate])

  async function fetchCandidates() {
    const { data, error } = await supabase
      .from('candidates')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching candidates:', error)
    } else {
      setCandidates(data || [])
    }
    setLoading(false)
  }

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, clients(company_name)')
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
    } else {
      setJobs(data || [])
    }
  }

  async function fetchApplicationsForCandidate(candidateId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('id, stage, job_id, jobs(id, title, clients(company_name))')
      .eq('candidate_id', candidateId)

    if (error) {
      console.error('Error fetching applications:', error)
    } else {
      setApplications(data || [])
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const candidateData = {
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email || null,
      phone: formData.phone || null,
      linkedin_url: formData.linkedin_url || null,
      github_url: formData.github_url || null,
      facebook_url: formData.facebook_url || null,
      instagram_url: formData.instagram_url || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country,
      current_title: formData.current_title || null,
      current_company: formData.current_company || null,
      years_experience: formData.years_experience ? parseFloat(formData.years_experience) : null,
      skills: formData.skills ? formData.skills.split(',').map(s => s.trim()).filter(Boolean) : null,
      notes: formData.notes || null,
      source: formData.source || null,
      status: formData.status
    }

    if (editingCandidate) {
      const { error } = await supabase
        .from('candidates')
        .update(candidateData)
        .eq('id', editingCandidate.id)

      if (error) {
        console.error('Error updating candidate:', error)
        alert('Error updating candidate')
      } else {
        setShowModal(false)
        setEditingCandidate(null)
        resetForm()
        fetchCandidates()
        if (selectedCandidate?.id === editingCandidate.id) {
          setSelectedCandidate({ ...selectedCandidate, ...candidateData })
        }
      }
    } else {
      const { error } = await supabase
        .from('candidates')
        .insert([{ ...candidateData, recruiter_id: user.id }])

      if (error) {
        console.error('Error creating candidate:', error)
        alert('Error creating candidate')
      } else {
        setShowModal(false)
        resetForm()
        fetchCandidates()
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this candidate?')) return

    const { error } = await supabase
      .from('candidates')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting candidate:', error)
      alert('Error deleting candidate')
    } else {
      fetchCandidates()
      if (selectedCandidate?.id === id) {
        setShowDetailView(false)
        setSelectedCandidate(null)
      }
    }
    setMenuOpen(null)
  }

  async function handleAddToJob(jobId: string) {
    if (!selectedCandidate) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('applications')
      .insert([{
        job_id: jobId,
        candidate_id: selectedCandidate.id,
        recruiter_id: user.id,
        stage: 'sourced'
      }])

    if (error) {
      if (error.code === '23505') {
        alert('Candidate is already added to this job')
      } else {
        console.error('Error adding to job:', error)
        alert('Error adding candidate to job')
      }
    } else {
      setShowAddToJobModal(false)
      fetchApplicationsForCandidate(selectedCandidate.id)
    }
  }

  function openDetailView(candidate: Candidate) {
    setSelectedCandidate(candidate)
    setShowDetailView(true)
    setMenuOpen(null)
  }

  function openEditModal(candidate: Candidate) {
    setEditingCandidate(candidate)
    setFormData({
      first_name: candidate.first_name,
      last_name: candidate.last_name,
      email: candidate.email || '',
      phone: candidate.phone || '',
      linkedin_url: candidate.linkedin_url || '',
      github_url: candidate.github_url || '',
      facebook_url: candidate.facebook_url || '',
      instagram_url: candidate.instagram_url || '',
      city: candidate.city || '',
      state: candidate.state || '',
      country: candidate.country || 'CA',
      current_title: candidate.current_title || '',
      current_company: candidate.current_company || '',
      years_experience: candidate.years_experience?.toString() || '',
      skills: candidate.skills?.join(', ') || '',
      notes: candidate.notes || '',
      source: candidate.source || '',
      status: candidate.status
    })
    setShowModal(true)
    setMenuOpen(null)
  }

  function resetForm() {
    setFormData({
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      linkedin_url: '',
      github_url: '',
      facebook_url: '',
      instagram_url: '',
      city: '',
      state: '',
      country: 'CA',
      current_title: '',
      current_company: '',
      years_experience: '',
      skills: '',
      notes: '',
      source: '',
      status: 'active'
    })
    setEditingCandidate(null)
  }

  const filteredCandidates = candidates.filter(candidate =>
    `${candidate.first_name} ${candidate.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.current_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    candidate.skills?.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const statusColors: Record<string, string> = {
    active: 'bg-green-100 text-green-700',
    inactive: 'bg-gray-100 text-gray-700',
    placed: 'bg-blue-100 text-blue-700',
    do_not_contact: 'bg-red-100 text-red-700'
  }

  const stageColors: Record<string, string> = {
    sourced: 'bg-gray-100 text-gray-700',
    contacted: 'bg-blue-100 text-blue-700',
    screening: 'bg-yellow-100 text-yellow-700',
    submitted: 'bg-purple-100 text-purple-700',
    interviewing: 'bg-orange-100 text-orange-700',
    offer: 'bg-green-100 text-green-700',
    hired: 'bg-emerald-100 text-emerald-700',
    rejected: 'bg-red-100 text-red-700',
    withdrawn: 'bg-gray-100 text-gray-700'
  }

  const formatLocation = (city: string | null, state: string | null, country: string | null) => {
    const stateName = country && state ? provinces[country]?.find(p => p.code === state)?.name || state : state
    return [city, stateName].filter(Boolean).join(', ') || null
  }

  // Detail View
  if (showDetailView && selectedCandidate) {
    return (
      <div className="p-8">
        {/* Back Button */}
        <button
          onClick={() => { setShowDetailView(false); setSelectedCandidate(null) }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Candidates
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex gap-4">
                  <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-semibold text-2xl">
                    {selectedCandidate.first_name[0]}{selectedCandidate.last_name[0]}
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h1 className="text-2xl font-bold text-gray-900">
                        {selectedCandidate.first_name} {selectedCandidate.last_name}
                      </h1>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedCandidate.status]}`}>
                        {selectedCandidate.status.replace('_', ' ')}
                      </span>
                    </div>
                    {(selectedCandidate.current_title || selectedCandidate.current_company) && (
                      <p className="text-gray-600">
                        {[selectedCandidate.current_title, selectedCandidate.current_company].filter(Boolean).join(' at ')}
                      </p>
                    )}
                    {selectedCandidate.years_experience && (
                      <p className="text-sm text-gray-500 mt-1">
                        {selectedCandidate.years_experience} years experience
                      </p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(selectedCandidate)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => setShowAddToJobModal(true)}
                    className="flex items-center gap-2 px-3 py-2 bg-brand-green text-white rounded-lg hover:bg-green-700"
                  >
                    <UserPlus className="w-4 h-4" />
                    Add to Job
                  </button>
                </div>
              </div>

              {/* Contact Info */}
              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100">
                {selectedCandidate.email && (
                  <a href={`mailto:${selectedCandidate.email}`} className="flex items-center gap-2 text-gray-600 hover:text-brand-blue">
                    <Mail className="w-4 h-4" />
                    {selectedCandidate.email}
                  </a>
                )}
                {selectedCandidate.phone && (
                  <a href={`tel:${selectedCandidate.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-brand-blue">
                    <Phone className="w-4 h-4" />
                    {selectedCandidate.phone}
                  </a>
                )}
                {formatLocation(selectedCandidate.city, selectedCandidate.state, selectedCandidate.country) && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4" />
                    {formatLocation(selectedCandidate.city, selectedCandidate.state, selectedCandidate.country)}
                  </div>
                )}
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-3 pt-4">
                {selectedCandidate.linkedin_url && (
                  <a href={selectedCandidate.linkedin_url} target="_blank" rel="noopener noreferrer" 
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100">
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
                {selectedCandidate.github_url && (
                  <a href={selectedCandidate.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
                    <Github className="w-4 h-4" />
                    GitHub
                  </a>
                )}
                {selectedCandidate.facebook_url && (
                  <a href={selectedCandidate.facebook_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100">
                    <Facebook className="w-4 h-4" />
                    Facebook
                  </a>
                )}
                {selectedCandidate.instagram_url && (
                  <a href={selectedCandidate.instagram_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg hover:bg-pink-100">
                    <Instagram className="w-4 h-4" />
                    Instagram
                  </a>
                )}
              </div>
            </div>

            {/* Skills */}
            {selectedCandidate.skills && selectedCandidate.skills.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Skills</h2>
                <div className="flex flex-wrap gap-2">
                  {selectedCandidate.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Notes */}
            {selectedCandidate.notes && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Notes</h2>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedCandidate.notes}</p>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Jobs Applied */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Jobs</h2>
              {applications.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Not linked to any jobs</p>
                  <button
                    onClick={() => setShowAddToJobModal(true)}
                    className="mt-3 text-sm text-brand-green hover:underline"
                  >
                    Add to a job
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">{app.jobs.title}</div>
                      {app.jobs.clients && (
                        <div className="text-sm text-gray-500">{app.jobs.clients.company_name}</div>
                      )}
                      <span className={`inline-flex mt-2 px-2 py-0.5 text-xs font-medium rounded-full ${stageColors[app.stage]}`}>
                        {app.stage}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Info</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Source</span>
                  <span className="text-gray-900">{selectedCandidate.source || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Added</span>
                  <span className="text-gray-900">{new Date(selectedCandidate.created_at).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <button className="w-full flex items-center gap-2 px-3 py-2 text-left text-gray-700 hover:bg-gray-50 rounded-lg">
                  <FileText className="w-4 h-4" />
                  Generate Resume
                </button>
                <button
                  onClick={() => handleDelete(selectedCandidate.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Candidate
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Add to Job Modal */}
        {showAddToJobModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-100">
                <h2 className="text-xl font-semibold text-gray-900">Add to Job</h2>
                <button onClick={() => setShowAddToJobModal(false)} className="p-1 hover:bg-gray-100 rounded">
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>
              <div className="p-6">
                {jobs.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No open jobs available</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {jobs.map((job) => (
                      <button
                        key={job.id}
                        onClick={() => handleAddToJob(job.id)}
                        className="w-full p-3 text-left bg-gray-50 hover:bg-gray-100 rounded-lg"
                      >
                        <div className="font-medium text-gray-900">{job.title}</div>
                        {job.clients && (
                          <div className="text-sm text-gray-500">{job.clients.company_name}</div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // List View
  return (
    <div className="p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500 mt-1">Manage your candidate pipeline</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Add Candidate
        </button>
      </div>

      {/* Search */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search candidates by name, email, title, or skills..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredCandidates.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No candidates found' : 'No candidates yet'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery ? 'Try a different search term' : 'Add candidates to start building your talent pipeline.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
            >
              <Plus className="w-5 h-5" />
              Add Your First Candidate
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCandidates.map((candidate) => (
            <div 
              key={candidate.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:border-brand-accent transition-colors"
              onClick={() => openDetailView(candidate)}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4">
                  <div className="w-12 h-12 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-semibold text-lg">
                    {candidate.first_name[0]}{candidate.last_name[0]}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="text-lg font-semibold text-gray-900">
                        {candidate.first_name} {candidate.last_name}
                      </h3>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[candidate.status]}`}>
                        {candidate.status.replace('_', ' ')}
                      </span>
                    </div>
                    {(candidate.current_title || candidate.current_company) && (
                      <div className="flex items-center gap-1 text-gray-600 mb-2">
                        <Briefcase className="w-4 h-4" />
                        {[candidate.current_title, candidate.current_company].filter(Boolean).join(' at ')}
                      </div>
                    )}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                      {candidate.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-4 h-4" />
                          {candidate.email}
                        </div>
                      )}
                      {formatLocation(candidate.city, candidate.state, candidate.country) && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {formatLocation(candidate.city, candidate.state, candidate.country)}
                        </div>
                      )}
                    </div>
                    {candidate.skills && candidate.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {candidate.skills.slice(0, 5).map((skill, i) => (
                          <span key={i} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                            {skill}
                          </span>
                        ))}
                        {candidate.skills.length > 5 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs rounded-full">
                            +{candidate.skills.length - 5} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpen(menuOpen === candidate.id ? null : candidate.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {menuOpen === candidate.id && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[120px]">
                      <button
                        onClick={() => openEditModal(candidate)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(candidate.id)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-gray-50"
                      >
                        <Trash2 className="w-4 h-4" />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingCandidate ? 'Edit Candidate' : 'Add New Candidate'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.first_name}
                    onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.last_name}
                    onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <h3 className="font-medium text-gray-900 pt-2">Social Profiles</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={formData.linkedin_url}
                    onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="https://linkedin.com/in/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">GitHub</label>
                  <input
                    type="url"
                    value={formData.github_url}
                    onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="https://github.com/..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={formData.facebook_url}
                    onChange={(e) => setFormData({ ...formData, facebook_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="https://facebook.com/..."
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instagram</label>
                  <input
                    type="url"
                    value={formData.instagram_url}
                    onChange={(e) => setFormData({ ...formData, instagram_url: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="https://instagram.com/..."
                  />
                </div>
              </div>

              <h3 className="font-medium text-gray-900 pt-2">Location</h3>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                <select
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>{country.name}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {formData.country === 'CA' ? 'Province' : 'State'}
                  </label>
                  <select
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="">Select {formData.country === 'CA' ? 'province' : 'state'}...</option>
                    {availableProvinces.map((prov) => (
                      <option key={prov.code} value={prov.code}>{prov.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <h3 className="font-medium text-gray-900 pt-2">Experience</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Title</label>
                  <input
                    type="text"
                    value={formData.current_title}
                    onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Current Company</label>
                  <input
                    type="text"
                    value={formData.current_company}
                    onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Years Experience</label>
                  <input
                    type="number"
                    value={formData.years_experience}
                    onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="">Select source...</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Indeed">Indeed</option>
                    <option value="Referral">Referral</option>
                    <option value="Job Board">Job Board</option>
                    <option value="Website">Website</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                <input
                  type="text"
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="JavaScript, React, Node.js (comma separated)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="placed">Placed</option>
                  <option value="do_not_contact">Do Not Contact</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm() }}
                  className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
                >
                  {editingCandidate ? 'Save Changes' : 'Add Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
