'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Building, Search, Users, Globe, Lock, Plus } from 'lucide-react'

interface Agency {
  id: string
  name: string
  slug: string
  description: string | null
  logo_url: string | null
  tagline: string | null
  is_public: boolean
  primary_color: string
  member_count?: number
}

export default function AgenciesPage() {
  const [agencies, setAgencies] = useState<Agency[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchAgencies()
  }, [])

  async function fetchAgencies() {
    // Fetch public agencies with member count
    const { data, error } = await supabase
      .from('agencies')
      .select(`
        id, name, slug, description, logo_url, tagline, is_public, primary_color,
        agency_members(count)
      `)
      .eq('is_public', true)
      .eq('status', 'active')
      .order('name')

    if (!error && data) {
      const agenciesWithCount = data.map(agency => ({
        ...agency,
        member_count: agency.agency_members?.[0]?.count || 0
      }))
      setAgencies(agenciesWithCount)
    }
    setLoading(false)
  }

  const filteredAgencies = agencies.filter(a => 
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.tagline?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Link>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-indigo-500 rounded-lg">
                <Building className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Virtual Agencies</h1>
                <p className="text-white/70">Discover agencies on the platform</p>
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