'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase'
import { ArrowLeft, Newspaper, Calendar, ExternalLink } from 'lucide-react'

interface BlogPost {
  id: string
  title: string
  slug: string
  summary: string | null
  published_at: string
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    fetchPosts()
  }, [])

  async function fetchPosts() {
    const { data, error } = await supabase
      .from('blog_posts')
      .select('id, title, slug, summary, published_at')
      .order('published_at', { ascending: false })
      .limit(30)

    if (!error && data) {
      setPosts(data)
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

  // Group posts by date
  const postsByDate = posts.reduce((acc, post) => {
    const date = new Date(post.published_at).toDateString()
    if (!acc[date]) {
      acc[date] = []
    }
    acc[date].push(post)
    return acc
  }, {} as Record<string, BlogPost[]>)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="inline-flex items-center gap-2 text-white/70 hover:text-white mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to Hub
          </Link>
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-500 rounded-lg">
              <Newspaper className="w-8 h-8" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Industry News</h1>
              <p className="text-white/70">Daily AI-curated recruitment industry news and insights</p>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading...</div>
        ) : posts.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-2">No news articles yet.</p>
            <p className="text-sm text-gray-400">Check back tomorrow for the latest industry updates!</p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(postsByDate).map(([date, datePosts]) => (
              <div key={date}>
                <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                  <Calendar className="w-4 h-4" />
                  {formatDate(datePosts[0].published_at)}
                </div>
                <div className="space-y-4">
                  {datePosts.map((post) => (
                    <Link
                      key={post.id}
                      href={`/blog/${post.slug}`}
                      className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md hover:border-gray-200 transition-all group"
                    >
                      <h2 className="text-xl font-semibold text-gray-900 group-hover:text-brand-accent transition-colors">
                        {post.title}
                      </h2>
                      {post.summary && (
                        <p className="text-gray-600 mt-2 line-clamp-2">{post.summary}</p>
                      )}
                      <div className="flex items-center gap-1 text-sm text-brand-accent mt-4">
                        Read more
                        <ExternalLink className="w-3 h-3" />
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
