'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Mail, Briefcase, User } from 'lucide-react'

interface Recruiter {
  id: string
  full_name: string | null
  email: string
  specializations: string[] | null
  bio: string | null
  avatar_url: string | null
}

export default function RecruiterDetailPage() {
  const params = useParams()
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchRecruiter(params.id as string)
    }
  }, [params.id])

  async function fetchRecruiter(id: string) {
    const { data, error } = await supabase
      .from('recruiters')
      .select('id, full_name, email, specializations, bio, avatar_url')
      .eq('id', id)
      .single()

    if (!error && data) {
      setRecruiter(data)
    }
    setLoading(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!recruiter) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Recruiter not found</div>
          <Link href="/recruiters" className="text-brand-accent hover:underline">
            Back to directory
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/recruiters" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Directory
          </Link>
          
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 bg-gradient-to-br from-teal-400 to-teal-600 rounded-full flex items-center justify-center text-white text-3xl font-bold flex-shrink-0">
              {recruiter.avatar_url ? (
                <img 
                  src={recruiter.avatar_url} 
                  alt={recruiter.full_name || ''} 
                  className="w-full h-full rounded-full object-cover"
                />
              ) : (
                recruiter.full_name?.charAt(0) || recruiter.email.charAt(0).toUpperCase()
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold">
                {recruiter.full_name || recruiter.email.split('@')[0]}
              </h1>
              <div className="flex items-center gap-2 text-white/70 mt-2">
                <Mail className="w-4 h-4" />
                <a href={`mailto:${recruiter.email}`} className="hover:text-white">
                  {recruiter.email}
                </a>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 space-y-6">
            {/* Bio */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="w-5 h-5 text-gray-400" />
                About
              </h2>
              {recruiter.bio ? (
                <p className="text-gray-600 leading-relaxed">{recruiter.bio}</p>
              ) : (
                <p className="text-gray-400 italic">No bio added yet.</p>
              )}
            </div>

            {/* Contact Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Contact</h2>
              <a 
                href={`mailto:${recruiter.email}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                <Mail className="w-4 h-4" />
                Send Email
              </a>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Specializations */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-gray-400" />
                Specializations
              </h2>
              {recruiter.specializations && recruiter.specializations.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {recruiter.specializations.map((spec) => (
                    <span 
                      key={spec}
                      className="px-3 py-1 bg-teal-50 text-teal-700 text-sm rounded-full"
                    >
                      {spec}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 italic text-sm">No specializations listed.</p>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
