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
      const { email, full_name, phone, city, state_province, country, is_admin, specializations } = body

      // Validate email is @search.market
      if (!email.toLowerCase().endsWith('@search.market')) {
        return NextResponse.json({ error: 'Email must be a @search.market address (e.g., firstname.lastname@search.market)' }, { status: 400 })
      }

      // Check if recruiter already exists (use maybeSingle to avoid errors)
      const { data: existingRecruiter } = await supabaseAdmin
        .from('recruiters')
        .select('id, email')
        .ilike('email', email)
        .maybeSingle()

      if (existingRecruiter) {
        return NextResponse.json({ error: 'A recruiter with this email already exists' }, { status: 400 })
      }

      // Check if auth user already exists
      const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers()
      const existingAuthUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email.toLowerCase())
      
      if (existingAuthUser) {
        // Auth user exists - upsert the recruiter profile
        // Generate slug from full_name or email
        const baseSlug = full_name 
          ? full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
          : email.toLowerCase().split('@')[0].replace(/[^a-z0-9]+/g, '-')
        
        const { error: profileError } = await supabaseAdmin
          .from('recruiters')
          .upsert({
            id: existingAuthUser.id,
            email: email.toLowerCase(),
            full_name: full_name || null,
            phone: phone || null,
            city: city || null,
            state_province: state_province || null,
            country: country || null,
            is_admin: is_admin || false,
            is_available: true,
            force_password_change: true,
            specializations: specializations && specializations.length > 0 ? specializations : null,
            slug: baseSlug
          }, { onConflict: 'id' })

        if (profileError) {
          return NextResponse.json({ error: profileError.message }, { status: 400 })
        }

        return NextResponse.json({ success: true, user: existingAuthUser, note: 'Profile created/updated for existing auth user' })
      }

      // Create auth user with default password
      // NOTE: A trigger (handle_new_user) will auto-create a recruiter record
      const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: email.toLowerCase(),
        password: 'h3ll0Th3r3',
        email_confirm: true
      })

      if (authError) {
        return NextResponse.json({ error: authError.message }, { status: 400 })
      }

      // Generate slug from full_name or email
      const baseSlug = full_name 
        ? full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        : email.toLowerCase().split('@')[0].replace(/[^a-z0-9]+/g, '-')

      // Update the recruiter profile created by the trigger
      const { error: profileError } = await supabaseAdmin
        .from('recruiters')
        .update({
          full_name: full_name || null,
          phone: phone || null,
          city: city || null,
          state_province: state_province || null,
          country: country || null,
          is_admin: is_admin || false,
          is_available: true,
          force_password_change: true,
          specializations: specializations && specializations.length > 0 ? specializations : null,
          slug: baseSlug
        })
        .eq('id', authData.user.id)

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

    if (action === 'reset_password') {
      const { recruiter_id, new_password } = body

      if (!new_password || new_password.length < 8) {
        return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
      }

      const { error } = await supabaseAdmin.auth.admin.updateUserById(
        recruiter_id,
        { password: new_password }
      )

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      // Optionally set force_password_change flag
      await supabaseAdmin
        .from('recruiters')
        .update({ force_password_change: true })
        .eq('id', recruiter_id)

      return NextResponse.json({ success: true })
    }

    if (action === 'update_recruiter') {
      const { recruiter_id, full_name, phone, city, state_province, country, bio, linkedin_url, is_admin, is_available, specializations } = body
      
      // Check if recruiter has a slug, if not generate one
      const { data: existingRecruiter } = await supabaseAdmin
        .from('recruiters')
        .select('slug, email')
        .eq('id', recruiter_id)
        .single()
      
      let slug = existingRecruiter?.slug
      if (!slug && full_name) {
        slug = full_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      } else if (!slug && existingRecruiter?.email) {
        slug = existingRecruiter.email.toLowerCase().split('@')[0].replace(/[^a-z0-9]+/g, '-')
      }
      
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
          is_available,
          specializations,
          slug
        })
        .eq('id', recruiter_id)

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 })
      }

      return NextResponse.json({ success: true })
    }

    if (action === 'create_agency') {
      const { name, slug, description, owner_id, is_public, is_accepting_members, website, email, phone, tagline } = body

      const { data, error } = await supabaseAdmin
        .from('agencies')
        .insert({
          name,
          slug,
          description: description || null,
          owner_id,
          is_public: is_public || false,
          is_accepting_members: is_accepting_members || false,
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
