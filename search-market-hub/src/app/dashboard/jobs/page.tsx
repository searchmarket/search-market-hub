'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase-browser'
import { countries, provinces } from '@/lib/location-data'
import { 
  Plus, Search, Briefcase, MoreVertical, Pencil, Trash2, X, Building2, 
  MapPin, DollarSign, ArrowLeft, Users, Sparkles, Globe, GlobeOff, Loader2
} from 'lucide-react'

interface Client {
  id: string
  company_name: string
}

interface Candidate {
  id: string
  first_name: string
  last_name: string
  current_title: string | null
}

interface Application {
  id: string
  stage: string
  candidate_id: string
  candidates: Candidate
}

interface Job {
  id: string
  title: string
  client_id: string | null
  clients: Client | null
  city: string | null
  state: string | null
  country: string | null
  location_type: string
  employment_type: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  fee_percent: number | null
  status: string
  description: string | null
  requirements: string | null
  is_published: boolean
  created_at: string
}

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [showDetailView, setShowDetailView] = useState(false)
  const [selectedJob, setSelectedJob] = useState<Job | null>(null)
  const [editingJob, setEditingJob] = useState<Job | null>(null)
  const [menuOpen, setMenuOpen] = useState<string | null>(null)
  const [generatingJD, setGeneratingJD] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    title: '',
    client_id: '',
    description: '',
    requirements: '',
    city: '',
    state: '',
    country: 'CA',
    location_type: 'onsite',
    employment_type: 'permanent',
    salary_min: '',
    salary_max: '',
    salary_currency: 'CAD',
    fee_percent: '',
    status: 'open'
  })

  const availableProvinces = provinces[formData.country] || []

  useEffect(() => {
    fetchJobs()
    fetchClients()
  }, [])

  useEffect(() => {
    if (formData.state && !availableProvinces.find(p => p.code === formData.state)) {
      setFormData(prev => ({ ...prev, state: '' }))
    }
    if (formData.country === 'CA') {
      setFormData(prev => ({ ...prev, salary_currency: 'CAD' }))
    } else if (formData.country === 'US') {
      setFormData(prev => ({ ...prev, salary_currency: 'USD' }))
    }
  }, [formData.country])

  useEffect(() => {
    if (selectedJob) {
      fetchApplicationsForJob(selectedJob.id)
    }
  }, [selectedJob])

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, clients(id, company_name)')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
    } else {
      setJobs(data || [])
    }
    setLoading(false)
  }

  async function fetchClients() {
    const { data, error } = await supabase
      .from('clients')
      .select('id, company_name')
      .eq('status', 'active')
      .order('company_name')

    if (error) {
      console.error('Error fetching clients:', error)
    } else {
      setClients(data || [])
    }
  }

  async function fetchApplicationsForJob(jobId: string) {
    const { data, error } = await supabase
      .from('applications')
      .select('id, stage, candidate_id, candidates(id, first_name, last_name, current_title)')
      .eq('job_id', jobId)

    if (error) {
      console.error('Error fetching applications:', error)
    } else {
      setApplications(data || [])
    }
  }

  async function generateJobDescription() {
    if (!formData.title) {
      alert('Please enter a job title first')
      return
    }

    setGeneratingJD(true)

    try {
      const response = await fetch('/api/generate-jd', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          company: clients.find(c => c.id === formData.client_id)?.company_name || '',
          location: formData.city,
          locationType: formData.location_type,
          employmentType: formData.employment_type,
          salaryMin: formData.salary_min,
          salaryMax: formData.salary_max,
          currency: formData.salary_currency
        })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to generate description')
      }

      const data = await response.json()
      setFormData(prev => ({
        ...prev,
        description: data.description,
        requirements: data.requirements
      }))
    } catch (error) {
      console.error('Error generating JD:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate job description. Make sure API key is configured.')
    }

    setGeneratingJD(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const jobData = {
      title: formData.title,
      client_id: formData.client_id || null,
      description: formData.description || null,
      requirements: formData.requirements || null,
      city: formData.city || null,
      state: formData.state || null,
      country: formData.country,
      location_type: formData.location_type,
      employment_type: formData.employment_type,
      salary_min: formData.salary_min ? parseFloat(formData.salary_min) : null,
      salary_max: formData.salary_max ? parseFloat(formData.salary_max) : null,
      salary_currency: formData.salary_currency,
      fee_percent: formData.fee_percent ? parseFloat(formData.fee_percent) : null,
      status: formData.status
    }

    if (editingJob) {
      const { error } = await supabase
        .from('jobs')
        .update(jobData)
        .eq('id', editingJob.id)

      if (error) {
        console.error('Error updating job:', error)
        alert('Error updating job')
      } else {
        setShowModal(false)
        setEditingJob(null)
        resetForm()
        fetchJobs()
        if (selectedJob?.id === editingJob.id) {
          setSelectedJob({ ...selectedJob, ...jobData, clients: selectedJob.clients })
        }
      }
    } else {
      const { error } = await supabase
        .from('jobs')
        .insert([{ ...jobData, recruiter_id: user.id, is_published: false }])

      if (error) {
        console.error('Error creating job:', error)
        alert('Error creating job')
      } else {
        setShowModal(false)
        resetForm()
        fetchJobs()
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this job?')) return

    const { error } = await supabase
      .from('jobs')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting job:', error)
      alert('Error deleting job')
    } else {
      fetchJobs()
      if (selectedJob?.id === id) {
        setShowDetailView(false)
        setSelectedJob(null)
      }
    }
    setMenuOpen(null)
  }

  async function togglePublish(job: Job) {
    const newPublishState = !job.is_published

    const { error } = await supabase
      .from('jobs')
      .update({ is_published: newPublishState })
      .eq('id', job.id)

    if (error) {
      console.error('Error updating publish status:', error)
      alert('Error updating publish status')
    } else {
      fetchJobs()
      if (selectedJob?.id === job.id) {
        setSelectedJob({ ...selectedJob, is_published: newPublishState })
      }
    }
  }

  function openDetailView(job: Job) {
    setSelectedJob(job)
    setShowDetailView(true)
    setMenuOpen(null)
  }

  function openEditModal(job: Job) {
    setEditingJob(job)
    setFormData({
      title: job.title,
      client_id: job.client_id || '',
      description: job.description || '',
      requirements: job.requirements || '',
      city: job.city || '',
      state: job.state || '',
      country: job.country || 'CA',
      location_type: job.location_type,
      employment_type: job.employment_type,
      salary_min: job.salary_min?.toString() || '',
      salary_max: job.salary_max?.toString() || '',
      salary_currency: job.salary_currency,
      fee_percent: job.fee_percent?.toString() || '',
      status: job.status
    })
    setShowModal(true)
    setMenuOpen(null)
  }

  function resetForm() {
    setFormData({
      title: '',
      client_id: '',
      description: '',
      requirements: '',
      city: '',
      state: '',
      country: 'CA',
      location_type: 'onsite',
      employment_type: 'permanent',
      salary_min: '',
      salary_max: '',
      salary_currency: 'CAD',
      fee_percent: '',
      status: 'open'
    })
    setEditingJob(null)
  }

  const filteredJobs = jobs.filter(job =>
    job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    job.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    open: 'bg-green-100 text-green-700',
    on_hold: 'bg-yellow-100 text-yellow-700',
    filled: 'bg-blue-100 text-blue-700',
    cancelled: 'bg-red-100 text-red-700'
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

  const formatLocation = (city: string | null, state: string | null, country: string | null, locationType: string) => {
    const stateName = country && state ? provinces[country]?.find(p => p.code === state)?.name || state : state
    const location = [city, stateName].filter(Boolean).join(', ')
    if (!location) return locationType
    return `${location} (${locationType})`
  }

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return '-'
    const fmt = (n: number) => `$${n.toLocaleString()}`
    if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency}`
    if (min) return `${fmt(min)}+ ${currency}`
    if (max) return `Up to ${fmt(max)} ${currency}`
    return '-'
  }

  // Detail View
  if (showDetailView && selectedJob) {
    return (
      <div className="p-8">
        <button
          onClick={() => { setShowDetailView(false); setSelectedJob(null) }}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Jobs
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Header Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <h1 className="text-2xl font-bold text-gray-900">{selectedJob.title}</h1>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[selectedJob.status]}`}>
                      {selectedJob.status.replace('_', ' ')}
                    </span>
                    {selectedJob.is_published && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-brand-green/10 text-brand-green">
                        <Globe className="w-3 h-3" />
                        Published
                      </span>
                    )}
                  </div>
                  {selectedJob.clients && (
                    <p className="text-lg text-gray-600">{selectedJob.clients.company_name}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(selectedJob)}
                    className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg hover:bg-gray-50"
                  >
                    <Pencil className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() => togglePublish(selectedJob)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                      selectedJob.is_published
                        ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        : 'bg-brand-green text-white hover:bg-green-700'
                    }`}
                  >
                    {selectedJob.is_published ? <GlobeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                    {selectedJob.is_published ? 'Unpublish' : 'Publish to Board'}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-100 text-sm text-gray-600">
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  {formatLocation(selectedJob.city, selectedJob.state, selectedJob.country, selectedJob.location_type)}
                </div>
                <div className="flex items-center gap-1">
                  <DollarSign className="w-4 h-4" />
                  {formatSalary(selectedJob.salary_min, selectedJob.salary_max, selectedJob.salary_currency)}
                </div>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {selectedJob.employment_type.replace('_', ' ')}
                </div>
                {selectedJob.fee_percent && (
                  <div className="text-brand-green font-medium">
                    {selectedJob.fee_percent}% fee
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {selectedJob.description && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Description</h2>
                <div className="text-gray-600 whitespace-pre-wrap">{selectedJob.description}</div>
              </div>
            )}

            {/* Requirements */}
            {selectedJob.requirements && (
              <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Requirements</h2>
                <div className="text-gray-600 whitespace-pre-wrap">{selectedJob.requirements}</div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Candidates */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Candidates ({applications.length})</h2>
              {applications.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No candidates yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {applications.map((app) => (
                    <div key={app.id} className="p-3 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900">
                        {app.candidates.first_name} {app.candidates.last_name}
                      </div>
                      {app.candidates.current_title && (
                        <div className="text-sm text-gray-500">{app.candidates.current_title}</div>
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
                  <span className="text-gray-500">Created</span>
                  <span className="text-gray-900">{new Date(selectedJob.created_at).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Status</span>
                  <span className="text-gray-900 capitalize">{selectedJob.status.replace('_', ' ')}</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
              <div className="space-y-2">
                <button
                  onClick={() => handleDelete(selectedJob.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-left text-red-600 hover:bg-red-50 rounded-lg"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Job
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // List View
  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Jobs</h1>
          <p className="text-gray-500 mt-1">Manage your job postings</p>
        </div>
        <button
          onClick={() => { resetForm(); setShowModal(true) }}
          className="flex items-center gap-2 px-4 py-2.5 bg-brand-navy text-white font-medium rounded-lg hover:bg-brand-blue transition-colors"
        >
          <Plus className="w-5 h-5" />
          Post New Job
        </button>
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search jobs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
          />
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading...</div>
      ) : filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
          <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <Briefcase className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {searchQuery ? 'No jobs found' : 'No jobs yet'}
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {searchQuery ? 'Try a different search term' : 'Post your first job to start tracking candidates and placements.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-navy text-white font-medium rounded-lg hover:bg-brand-blue transition-colors"
            >
              <Plus className="w-5 h-5" />
              Post Your First Job
            </button>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredJobs.map((job) => (
            <div 
              key={job.id} 
              className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 cursor-pointer hover:border-brand-accent transition-colors"
              onClick={() => openDetailView(job)}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusColors[job.status]}`}>
                      {job.status.replace('_', ' ')}
                    </span>
                    {job.is_published && (
                      <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-brand-green/10 text-brand-green">
                        <Globe className="w-3 h-3" />
                        Published
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                    {job.clients && (
                      <div className="flex items-center gap-1">
                        <Building2 className="w-4 h-4" />
                        {job.clients.company_name}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {formatLocation(job.city, job.state, job.country, job.location_type)}
                    </div>
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-4 h-4" />
                      {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                    </div>
                    {job.fee_percent && (
                      <div className="text-brand-green font-medium">
                        {job.fee_percent}% fee
                      </div>
                    )}
                  </div>
                  <div className="mt-2 text-xs text-gray-400">
                    {job.employment_type.replace('_', ' ')} · Created {new Date(job.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div className="relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setMenuOpen(menuOpen === job.id ? null : job.id)}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <MoreVertical className="w-5 h-5 text-gray-400" />
                  </button>
                  {menuOpen === job.id && (
                    <div className="absolute right-0 top-10 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-10 min-w-[140px]">
                      <button
                        onClick={() => openEditModal(job)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        <Pencil className="w-4 h-4" />
                        Edit
                      </button>
                      <button
                        onClick={() => togglePublish(job)}
                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        {job.is_published ? <GlobeOff className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                        {job.is_published ? 'Unpublish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handleDelete(job.id)}
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

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-100">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingJob ? 'Edit Job' : 'Post New Job'}
              </h2>
              <button onClick={() => { setShowModal(false); resetForm() }} className="p-1 hover:bg-gray-100 rounded">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Job Title *</label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Client</label>
                <select
                  value={formData.client_id}
                  onChange={(e) => setFormData({ ...formData, client_id: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                >
                  <option value="">Select a client...</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>{client.company_name}</option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <button
                    type="button"
                    onClick={generateJobDescription}
                    disabled={generatingJD || !formData.title}
                    className="flex items-center gap-1 text-sm text-brand-accent hover:text-brand-blue disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingJD ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    {generatingJD ? 'Generating...' : 'Generate with AI'}
                  </button>
                </div>
                <textarea
                  rows={6}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="Job description, responsibilities..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Requirements</label>
                <textarea
                  rows={4}
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="Required qualifications, skills..."
                />
              </div>

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
                    placeholder="e.g. Toronto"
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location Type</label>
                  <select
                    value={formData.location_type}
                    onChange={(e) => setFormData({ ...formData, location_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="onsite">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employment Type</label>
                  <select
                    value={formData.employment_type}
                    onChange={(e) => setFormData({ ...formData, employment_type: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="permanent">Permanent</option>
                    <option value="contract">Contract</option>
                    <option value="contract_to_hire">Contract to Hire</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Min</label>
                  <input
                    type="number"
                    value={formData.salary_min}
                    onChange={(e) => setFormData({ ...formData, salary_min: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="80000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary Max</label>
                  <input
                    type="number"
                    value={formData.salary_max}
                    onChange={(e) => setFormData({ ...formData, salary_max: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="120000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
                  <select
                    value={formData.salary_currency}
                    onChange={(e) => setFormData({ ...formData, salary_currency: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="CAD">CAD</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Fee Percentage</label>
                  <input
                    type="number"
                    step="0.5"
                    value={formData.fee_percent}
                    onChange={(e) => setFormData({ ...formData, fee_percent: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="draft">Draft</option>
                    <option value="open">Open</option>
                    <option value="on_hold">On Hold</option>
                    <option value="filled">Filled</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
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
                  className="flex-1 px-4 py-2.5 bg-brand-navy text-white font-medium rounded-lg hover:bg-brand-blue transition-colors"
                >
                  {editingJob ? 'Save Changes' : 'Post Job'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
