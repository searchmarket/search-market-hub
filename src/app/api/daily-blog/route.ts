import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'

// This endpoint should be called by a cron job daily
export async function POST(request: Request) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!
    })

    // Generate blog post about recruitment industry news
    const today = new Date().toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: `You are a recruitment industry analyst writing a daily news digest for recruiters. Today is ${today}.

Write a comprehensive daily news article covering the latest trends, news, and insights in the recruitment and staffing industry. Include topics such as:
- Labor market trends
- Technology in recruiting (AI, ATS systems, automation)
- Remote work and hiring trends
- Salary and compensation trends
- Industry regulations and compliance
- Tips and best practices for recruiters

Format your response as JSON with the following structure:
{
  "title": "A compelling headline for today's digest",
  "summary": "A 2-3 sentence summary of the key points",
  "content": "The full article in HTML format with <h2>, <p>, <ul>, <li> tags. Make it informative and actionable for recruiters. Include 4-6 sections.",
  "topics": ["topic1", "topic2", "topic3"]
}

Return ONLY valid JSON, no markdown code blocks.`
        }
      ]
    })

    const responseText = (message.content[0] as { type: string; text: string }).text

    // Parse the response
    let blogData
    try {
      const cleanJson = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      blogData = JSON.parse(cleanJson)
    } catch {
      console.error('Failed to parse blog response:', responseText)
      return NextResponse.json({ error: 'Failed to generate blog content' }, { status: 500 })
    }

    // Generate slug from title
    const slug = blogData.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + Date.now()

    // Save to database
    const { data, error } = await supabase
      .from('blog_posts')
      .insert([{
        title: blogData.title,
        slug: slug,
        content: blogData.content,
        summary: blogData.summary,
        source_urls: [],
        published_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({ error: 'Failed to save blog post' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      post: {
        id: data.id,
        title: data.title,
        slug: data.slug
      }
    })

  } catch (error) {
    console.error('Error generating blog:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate blog' },
      { status: 500 }
    )
  }
}

// GET endpoint for manual testing
export async function GET() {
  return NextResponse.json({ 
    message: 'Daily blog generation endpoint. Use POST with CRON_SECRET to generate.' 
  })
}
