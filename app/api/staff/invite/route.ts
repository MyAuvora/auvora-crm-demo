import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: userData } = await supabase
      .from('users')
      .select('tenant_id, role')
      .eq('id', user.id)
      .single();

    if (!userData?.tenant_id) {
      return NextResponse.json({ error: 'Tenant not found' }, { status: 404 });
    }

    if (!['owner', 'manager'].includes(userData.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, role, phone, specialties, hourlyRate, password } = body;

    if (!name || !email || !role || !password) {
      return NextResponse.json({ error: 'Name, email, role, and password are required' }, { status: 400 });
    }

    const validRoles = ['manager', 'head-coach', 'coach', 'front-desk'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
    }

    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existingUser) {
      return NextResponse.json({ error: 'User with this email already exists' }, { status: 409 });
    }

    const { data: tenant } = await supabase
      .from('tenants')
      .select('name')
      .eq('id', userData.tenant_id)
      .single();

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          business_name: tenant?.name || 'Staff Account',
          role: role,
          tenant_id: userData.tenant_id,
          invited_by: user.id,
        },
      },
    });

    if (authError) {
      console.error('Auth signup error:', authError);
      return NextResponse.json({ error: authError.message }, { status: 400 });
    }

    if (!authData.user) {
      return NextResponse.json({ error: 'Failed to create user account' }, { status: 500 });
    }

    const staffData = {
      tenant_id: userData.tenant_id,
      name,
      email,
      role,
      phone: phone || null,
      specialties: specialties || [],
      hourly_rate: hourlyRate || null,
      status: 'active',
      hire_date: new Date().toISOString().split('T')[0],
      user_id: authData.user.id,
    };

    const { data: newStaff, error: staffError } = await supabase
      .from('staff')
      .insert(staffData)
      .select()
      .single();

    if (staffError) {
      console.error('Error creating staff record:', staffError);
    }

    const userRecord = {
      id: authData.user.id,
      tenant_id: userData.tenant_id,
      email,
      full_name: name,
      role,
    };

    const { error: userError } = await supabase
      .from('users')
      .upsert(userRecord, { onConflict: 'id' });

    if (userError) {
      console.error('Error creating user record:', userError);
    }

    return NextResponse.json({
      success: true,
      message: 'Staff member invited successfully',
      staff: newStaff,
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
    }, { status: 201 });
  } catch (error) {
    console.error('Staff invite error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
