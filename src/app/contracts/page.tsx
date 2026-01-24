'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, FileText, Plus, Search, Filter, File, DollarSign, Clock, CheckCircle } from 'lucide-react'

interface Contract {
  id: string
  title: string
  client_name: string
  status: string
  value: number
  created_at: string
}

export default function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'contracts' | 'invoices' | 'templates'>('contracts')
  const supabase = createClient()

  useEffect(() => {
    fetchContracts()
  }, [])

  async function fetchContracts() {
    // For now, just set loading to false since we don't have a contracts table yet
    setLoading(false)
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-slate-500 rounded-lg">
                <FileText className="w-8 h-8" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Contracts & Invoicing</h1>
                <p className="text-white/70">Manage contracts, agreements, and invoices</p>
              </div>
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-brand-green rounded-lg hover:bg-green-600 transition-colors">
              <Plus className="w-4 h-4" />
              New Contract
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4">
          <nav className="flex gap-8">
            <button
              onClick={() => setActiveTab('contracts')}
              className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'contracts'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <FileText className="w-4 h-4" />
              Contracts
            </button>
            <button
              onClick={() => setActiveTab('invoices')}
              className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'invoices'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <DollarSign className="w-4 h-4" />
              Invoices
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 border-b-2 font-medium text-sm flex items-center gap-2 ${
                activeTab === 'templates'
                  ? 'border-brand-accent text-brand-accent'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <File className="w-4 h-4" />
              Templates
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-blue-100 p-2 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">Total Contracts</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-yellow-100 p-2 rounded-lg">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">Pending</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">0</p>
                <p className="text-sm text-gray-500">Active</p>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
            <div className="flex items-center gap-3">
              <div className="bg-green-100 p-2 rounded-lg">
                <DollarSign className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900">$0</p>
                <p className="text-sm text-gray-500">Total Value</p>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search contracts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent focus:border-transparent"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <Filter className="w-5 h-5 text-gray-500" />
            <span className="text-gray-700">Filters</span>
          </button>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'contracts' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No contracts yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create contracts for your placements and manage all your agreements in one place.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-green-600 transition-colors">
              <Plus className="w-5 h-5" />
              Create Your First Contract
            </button>
          </div>
        )}

        {activeTab === 'invoices' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No invoices yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Generate invoices from your contracts and track payments.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-green-600 transition-colors">
              <Plus className="w-5 h-5" />
              Create Invoice
            </button>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <div className="bg-gray-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <File className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No templates yet</h3>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              Create reusable contract templates to speed up your workflow.
            </p>
            <button className="inline-flex items-center gap-2 px-4 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-green-600 transition-colors">
              <Plus className="w-5 h-5" />
              Create Template
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
