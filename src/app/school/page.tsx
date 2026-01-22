'use client'

import Link from 'next/link'
import { ArrowLeft, GraduationCap, BookOpen, Video, FileText, CheckCircle } from 'lucide-react'

export default function SchoolPage() {
  const modules = [
    {
      title: 'Getting Started',
      description: 'Platform overview and basic setup',
      lessons: ['Platform Tour', 'Setting Up Your Profile', 'Understanding the Dashboard'],
      completed: true
    },
    {
      title: 'Sourcing Candidates',
      description: 'Finding and attracting top talent',
      lessons: ['Boolean Search Techniques', 'LinkedIn Sourcing', 'Building Talent Pipelines'],
      completed: false
    },
    {
      title: 'Client Management',
      description: 'Building and maintaining client relationships',
      lessons: ['Initial Client Meetings', 'Job Intake Process', 'Managing Expectations'],
      completed: false
    },
    {
      title: 'Interview Process',
      description: 'Screening and qualifying candidates',
      lessons: ['Phone Screen Best Practices', 'Competency-Based Questions', 'Reference Checks'],
      completed: false
    },
    {
      title: 'Closing Deals',
      description: 'Negotiation and offer management',
      lessons: ['Salary Negotiation', 'Counter-Offer Handling', 'Onboarding Support'],
      completed: false
    },
    {
      title: 'Compliance & Ethics',
      description: 'Legal requirements and ethical practices',
      lessons: ['Employment Law Basics', 'Data Privacy (PIPEDA)', 'Anti-Discrimination'],
      completed: false
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
            <div className="p-3 bg-purple-500 rounded-lg">
              <GraduationCap className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Recruiter School</h1>
              <p className="text-white/70">Training materials and best practices</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">Your Progress</span>
            <span className="text-sm text-gray-500">1 of {modules.length} modules completed</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${(1 / modules.length) * 100}%` }}></div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module, index) => (
            <div 
              key={module.title}
              className={`bg-white rounded-xl shadow-sm border p-6 ${
                module.completed ? 'border-green-200' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    module.completed 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {module.completed ? <CheckCircle className="w-5 h-5" /> : index + 1}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{module.title}</h3>
                    <p className="text-sm text-gray-500">{module.description}</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 mb-4">
                {module.lessons.map((lesson) => (
                  <div key={lesson} className="flex items-center gap-2 text-sm text-gray-600">
                    <BookOpen className="w-4 h-4 text-gray-400" />
                    {lesson}
                  </div>
                ))}
              </div>

              <button 
                className={`w-full py-2 rounded-lg font-medium transition-colors ${
                  module.completed
                    ? 'bg-green-50 text-green-600 hover:bg-green-100'
                    : 'bg-purple-50 text-purple-600 hover:bg-purple-100'
                }`}
              >
                {module.completed ? 'Review Module' : 'Start Module'}
              </button>
            </div>
          ))}
        </div>

        {/* Resources Section */}
        <section className="mt-12">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Additional Resources</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <Video className="w-8 h-8 text-blue-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Video Library</h3>
              <p className="text-sm text-gray-500 mb-4">Watch recorded training sessions and webinars</p>
              <button className="text-sm text-brand-accent hover:underline">Browse videos →</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <FileText className="w-8 h-8 text-orange-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Templates</h3>
              <p className="text-sm text-gray-500 mb-4">Download email templates and scripts</p>
              <button className="text-sm text-brand-accent hover:underline">View templates →</button>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <BookOpen className="w-8 h-8 text-green-500 mb-4" />
              <h3 className="font-semibold text-gray-900 mb-2">Playbooks</h3>
              <p className="text-sm text-gray-500 mb-4">Step-by-step guides for common scenarios</p>
              <button className="text-sm text-brand-accent hover:underline">Read playbooks →</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
