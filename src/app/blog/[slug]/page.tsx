'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Calendar, ExternalLink } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  content: string
  summary: string | null
  source_urls: string[] | null
  published_at: string
}

export default function BlogPostPage() {
  const params = useParams()
  const [post, setPost] = useState<BlogPost | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.slug) {
      fetchPost(params.slug as string)
    }
  }, [params.slug])

  async function fetchPost(slug: string) {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!error && data) {
      setPost(data)
    }
    setLoading(false)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!post) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-gray-500 mb-4">Article not found</div>
          <Link href="/blog" className="text-brand-accent hover:underline">
            Back to news
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
          <Link href="/blog" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to News
          </Link>
          
          <h1 className="text-3xl font-bold mb-4">{post.title}</h1>
          
          <div className="flex items-center gap-2 text-white/70">
            <Calendar className="w-4 h-4" />
            {formatDate(post.published_at)}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <article className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          {/* Summary */}
          {post.summary && (
            <div className="text-xl text-gray-600 mb-8 pb-8 border-b border-gray-100 leading-relaxed">
              {post.summary}
            </div>
          )}

          {/* Content */}
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          {/* Sources */}
          {post.source_urls && post.source_urls.length > 0 && (
            <div className="mt-8 pt-8 border-t border-gray-100">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Sources
              </h3>
              <div className="space-y-2">
                {post.source_urls.map((url, index) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-sm text-brand-accent hover:underline"
                  >
                    <ExternalLink className="w-3 h-3" />
                    {new URL(url).hostname}
                  </a>
                ))}
              </div>
            </div>
          )}
        </article>

        {/* Navigation */}
        <div className="mt-8 text-center">
          <Link 
            href="/blog"
            className="inline-flex items-center gap-2 text-brand-accent hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to all news
          </Link>
        </div>
      </main>
    </div>
  )
}
