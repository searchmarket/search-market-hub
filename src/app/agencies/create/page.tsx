'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Building, Globe, Lock, Loader2 } from 'lucide-react'

export default function CreateAgencyPage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    tagline: '',
    description: '',
    is_public: true,
    website: '',
    email: '',
    phone: '',
    primary_color: '#1B2B4B',
    secondary_color: '#10B981'
  })

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        alert('You must be logged in to create an agency')
        setLoading(false)
        return
      }

      // Get recruiter record
      let { data: recruiter } = await supabase
        .from('recruiters')
        .select('id')
        .eq('user_id', user.id)
        .single()

      // Auto-create recruiter profile if not found
      if (!recruiter) {
        const { data: newRecruiter, error: createError } = await supabase
          .from('recruiters')
          .insert([{
            user_id: user.id,
            email: user.email,
            full_name: user.user_metadata?.full_name || null
          }])
          .select('id')
          .single()

        if (createError) {
          alert('Error creating recruiter profile: ' + createError.message)
          setLoading(false)
          return
        }
        recruiter = newRecruiter
      }

      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        + '-' + Date.now().toString(36)

      // Create agency
      const { data: agency, error: agencyError } = await supabase
        .from('agencies')
        .insert([{
          name: formData.name,
          slug: slug,
          tagline: formData.tagline || null,
          description: formData.description || null,
          is_public: formData.is_public,
          website: formData.website || null,
          email: formData.email || null,
          phone: formData.phone || null,
          primary_color: formData.primary_color,
          secondary_color: formData.secondary_color,
          owner_id: recruiter.id,
          status: 'active'
        }])
        .select()
        .single()

      if (agencyError) {
        console.error('Error creating agency:', agencyError)
        alert('Error creating agency: ' + agencyError.message)
        setLoading(false)
        return
      }

      // Add owner as member
      const { error: memberError } = await supabase
        .from('agency_members')
        .insert([{
          agency_id: agency.id,
          recruiter_id: recruiter.id,
          role: 'owner',
          status: 'active'
        }])

      if (memberError) {
        console.error('Error adding member:', memberError)
      }

      // Update recruiter's primary agency
      await supabase
        .from('recruiters')
        .update({ primary_agency_id: agency.id })
        .eq('id', recruiter.id)

      router.push(`/agencies/${agency.slug}`)
    } catch (error) {
      console.error('Error:', error)
      alert('An error occurred')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/agencies" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Agencies
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-500 rounded-lg">
              <Building className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Create Virtual Agency</h1>
              <p className="text-white/70">Start your own agency on the platform</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Basic Information</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Agency Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="e.g., Elite Tech Recruiters"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="e.g., Connecting top talent with leading companies"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="Tell potential members and clients about your agency..."
                />
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Visibility</h2>
            
            <div className="space-y-4">
              <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  checked={formData.is_public}
                  onChange={() => setFormData({ ...formData, is_public: true })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Globe className="w-4 h-4 text-green-500" />
                    Public Agency
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Visible to everyone on the platform. Other recruiters can request to join.
                  </p>
                </div>
              </label>

              <label className="flex items-start gap-4 p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                <input
                  type="radio"
                  name="visibility"
                  checked={!formData.is_public}
                  onChange={() => setFormData({ ...formData, is_public: false })}
                  className="mt-1"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 font-medium text-gray-900">
                    <Lock className="w-4 h-4 text-orange-500" />
                    Private Agency
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Only visible to members. You invite and vet recruiters manually.
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Contact Information</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="https://yourwebsite.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="contact@youragency.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  placeholder="+1 (555) 000-0000"
                />
              </div>
            </div>
          </div>

          {/* Branding */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Branding</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Primary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.primary_color}
                    onChange={(e) => setFormData({ ...formData, primary_color: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Secondary Color</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="w-12 h-10 rounded border border-gray-200 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.secondary_color}
                    onChange={(e) => setFormData({ ...formData, secondary_color: e.target.value })}
                    className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">Preview</label>
              <div 
                className="h-24 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: formData.primary_color }}
              >
                <span 
                  className="text-xl font-bold"
                  style={{ color: formData.secondary_color }}
                >
                  {formData.name || 'Your Agency Name'}
                </span>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link
              href="/agencies"
              className="px-6 py-3 border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </Link>
            <button
              type="submit"
              disabled={loading || !formData.name}
              className="px-6 py-3 bg-brand-green text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Creating...' : 'Create Agency'}
            </button>
          </div>
        </form>
      </main>
    </div>
  )
}
