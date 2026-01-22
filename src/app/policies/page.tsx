'use client'

import Link from 'next/link'
import { ArrowLeft, FileText, Download, Search, Book, Shield, DollarSign, Users, Briefcase } from 'lucide-react'
import { useState } from 'react'

export default function PoliciesPage() {
  const [searchQuery, setSearchQuery] = useState('')

  const categories = [
    {
      title: 'General Policies',
      icon: Book,
      color: 'bg-blue-500',
      docs: [
        { name: 'GP - Accountability', file: 'gp_accountability.pdf' },
        { name: 'GP - Client Representation', file: 'gp_client_represetnation.pdf' },
        { name: 'GP - Candidate Representation', file: 'GP_Candidate_represetnation.pdf' },
        { name: 'GP - Enterprise Accounts', file: 'gp_entrprise_accounts.pdf' },
      ]
    },
    {
      title: 'Commission & Compensation',
      icon: DollarSign,
      color: 'bg-green-500',
      docs: [
        { name: 'Commission Plan', file: 'comission_plan.pdf' },
        { name: 'Extension Commission Policy', file: 'extension_commission_policy.pdf' },
        { name: 'Desk Fee', file: 'desk_fee.pdf' },
        { name: 'Payroll Burdens', file: 'payroll_burdens.pdf' },
      ]
    },
    {
      title: 'Workflows & Processes',
      icon: Briefcase,
      color: 'bg-purple-500',
      docs: [
        { name: 'CM Workflow', file: 'cm_workflow.pdf' },
        { name: 'TM Workflow', file: 'tm_workflow.pdf' },
        { name: 'W2 Onboarding', file: 'w2_onboarding.pdf' },
        { name: 'Executive Search', file: 'exec_search.pdf' },
      ]
    },
    {
      title: 'Services & Contracts',
      icon: FileText,
      color: 'bg-orange-500',
      docs: [
        { name: 'TEEMA Services Overview', file: 'Teema_Services.pdf' },
        { name: 'Contract Services', file: 'contract_services.pdf' },
        { name: 'Subscription Services', file: 'subscription_services.pdf' },
        { name: 'Payroll Services', file: 'payroll_services.pdf' },
        { name: 'Contract Verbiage & Definitions', file: 'Contract_Verbiage_and_deinitions.pdf' },
      ]
    },
    {
      title: 'Agreements & Templates',
      icon: Shield,
      color: 'bg-red-500',
      docs: [
        { name: 'Master Client Agreement (Sample)', file: 'TEEMA_Master_Client_Agreement__TWD_Tech_CAD_ON.pdf' },
        { name: 'Search Agreement (CAN Sample)', file: 'TEEMA_Search_Agreement__CAN_Sample.pdf' },
        { name: 'Master Vendor Agreement (Sample)', file: 'TEEMA_Master_Vendor_Agreement__12175959_Canada_Inc___Craig_Ferguson_pdf_encrypted_.pdf' },
        { name: 'Consultant Schedule A (Sample)', file: 'TEEMA_Consultant_Sch_A_003__Evgeny_Vasilchenko.pdf' },
        { name: 'Member Assistant Agreement', file: 'member_asitant_agreement.pdf' },
      ]
    },
    {
      title: 'Marketing & Communications',
      icon: Users,
      color: 'bg-teal-500',
      docs: [
        { name: 'Marketing & Communications', file: 'marketing_and_comunications.pdf' },
        { name: 'New Member Brochure', file: 'New_Member_Brochure_2020.pdf' },
        { name: 'TEEMA Overview', file: 'Teema_Overview.pdf' },
      ]
    },
  ]

  const allDocs = categories.flatMap(cat => 
    cat.docs.map(doc => ({ ...doc, category: cat.title }))
  )

  const filteredCategories = searchQuery 
    ? categories.map(cat => ({
        ...cat,
        docs: cat.docs.filter(doc => 
          doc.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
      })).filter(cat => cat.docs.length > 0)
    : categories

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
            <div className="p-3 bg-green-500 rounded-lg">
              <FileText className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Policies & Procedures</h1>
              <p className="text-white/70">Company policies, guidelines, and standard procedures</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Search */}
        <div className="mb-8">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search documents..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-accent"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="space-y-8">
          {filteredCategories.map((category) => (
            <div key={category.title} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-4 border-b border-gray-100 bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`${category.color} p-2 rounded-lg text-white`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                  <span className="text-sm text-gray-500">({category.docs.length} documents)</span>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {category.docs.map((doc) => (
                  <div 
                    key={doc.file}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-red-500" />
                      <span className="text-gray-700">{doc.name}</span>
                    </div>
                    <a 
                      href={`/documents/${doc.file}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-1.5 text-sm text-brand-accent hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Download className="w-4 h-4" />
                      View PDF
                    </a>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {filteredCategories.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            No documents found matching "{searchQuery}"
          </div>
        )}
      </main>
    </div>
  )
}
