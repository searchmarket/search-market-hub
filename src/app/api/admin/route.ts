import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Create admin client with service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { action } = body

    if (action === 'create_recruiter') {
      const { email, full_name, phone, city, state_province, country, is_admin } = body

      // Create auth user with default password
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password: 'h3ll0Th3r3',
        email_confirm: true
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      // Create recruiter profile
      const { error: profileError } = await supabaseAdmin
        .from('recruiters')
        .insert({
          id: authData.user.id,
          email,
          full_name: full_name || null,
          phone: phone || null,
          city: city || null,
          state_province: state_province || null,
          country: country || null,
          is_admin: is_admin || false,
          is_available: true,
          force_password_change: true
        })

      if (profileError) {
        // Rollback: delete auth user if profile creation fails
        await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      return NextResponse.json({ success: true, user: authData.user })
    }

    if (action === 'delete_recruiter') {
      const { recruiter_id } = body

      // Delete from recruiters table first
      const { error: profileError } = await supabaseAdmin
        .from('recruiters')
        .delete()
        .eq('id', recruiter_id)

      if (profileError) {
        return NextResponse.json({ error: profileError.message }, { status: 400 })
      }

      // Delete auth user
      const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(recruiter_id)

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'update_recruiter') {
      const { recruiter_id, full_name, phone, city, state_province, country, bio, linkedin_url, is_admin, is_available } = body
      
      const { error } = await supabaseAdmin
        .from('recruiters')
        .update({
          full_name,
          phone,
          city,
          state_province,
          country,
          bio,
          linkedin_url,
          is_admin,
          is_available
        })
        .eq('id', recruiter_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'create_agency') {
      const { name, slug, description, owner_id, is_public, website, email, phone, tagline } = body

      const { data, error } = await supabaseAdmin
        .from('agencies')
        .insert({
          name,
          slug,
          description: description || null,
          owner_id,
          is_public: is_public || false,
          website: website || null,
          email: email || null,
          phone: phone || null,
          tagline: tagline || null,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Add owner as agency member
      await supabaseAdmin
        .from('agency_members')
        .insert({
          agency_id: data.id,
          recruiter_id: owner_id,
          role: 'owner',
          status: 'active'
        })

      return NextResponse.json({ success: true, agency: data })
    }

    if (action === 'delete_agency') {
      const { agency_id } = body

      // Delete agency members first
      await supabaseAdmin
        .from('agency_members')
        .delete()
        .eq('agency_id', agency_id)

      // Delete agency
      const { error } = await supabaseAdmin
        .from('agencies')
        .delete()
        .eq('id', agency_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
