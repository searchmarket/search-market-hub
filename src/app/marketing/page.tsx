'use client'

import Link from 'next/link'
import { ArrowLeft, Megaphone, FileText, Image, Mail, Share2, Download, Palette } from 'lucide-react'

export default function MarketingPage() {
  const categories = [
    {
      title: 'Email Templates',
      icon: Mail,
      color: 'bg-blue-500',
      items: [
        { name: 'Candidate Outreach', type: 'template' },
        { name: 'Client Introduction', type: 'template' },
        { name: 'Job Presentation', type: 'template' },
        { name: 'Follow-up Sequence', type: 'template' },
        { name: 'Offer Letter', type: 'template' },
      ]
    },
    {
      title: 'Social Media',
      icon: Share2,
      color: 'bg-purple-500',
      items: [
        { name: 'LinkedIn Post Templates', type: 'template' },
        { name: 'Job Posting Graphics', type: 'asset' },
        { name: 'Company Culture Posts', type: 'template' },
        { name: 'Industry Insights', type: 'template' },
      ]
    },
    {
      title: 'Brand Assets',
      icon: Palette,
      color: 'bg-orange-500',
      items: [
        { name: 'Logo Package', type: 'download' },
        { name: 'Brand Guidelines', type: 'pdf' },
        { name: 'Color Palette', type: 'asset' },
        { name: 'Font Files', type: 'download' },
        { name: 'Presentation Template', type: 'download' },
      ]
    },
    {
      title: 'Documents',
      icon: FileText,
      color: 'bg-green-500',
      items: [
        { name: 'Company Overview', type: 'pdf' },
        { name: 'Service Brochure', type: 'pdf' },
        { name: 'Case Studies', type: 'pdf' },
        { name: 'Testimonials', type: 'doc' },
      ]
    }
  ]

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
            <div className="p-3 bg-orange-500 rounded-lg">
              <Megaphone className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Marketing Tools</h1>
              <p className="text-white/70">Templates, brand assets, and marketing resources</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Categories */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {categories.map((category) => (
            <div key={category.title} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className={`${category.color} p-2 rounded-lg text-white`}>
                    <category.icon className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-semibold text-gray-900">{category.title}</h2>
                </div>
              </div>
              <div className="divide-y divide-gray-100">
                {category.items.map((item) => (
                  <div 
                    key={item.name}
                    className="p-4 flex items-center justify-between hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{item.name}</span>
                    </div>
                    <button className="p-2 text-gray-400 hover:text-brand-accent transition-colors">
                      <Download className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Request Section */}
        <section className="mt-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl p-8 text-white">
          <div className="max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">Need Custom Marketing Materials?</h2>
            <p className="text-white/80 mb-6">
              Request custom graphics, presentations, or marketing collateral from the marketing team.
            </p>
            <button className="px-6 py-3 bg-white text-orange-600 rounded-lg font-medium hover:bg-gray-100 transition-colors">
              Submit Request
            </button>
          </div>
        </section>
      </main>
    </div>
  )
}
