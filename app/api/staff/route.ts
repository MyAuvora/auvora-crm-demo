import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    const { data: staff, error } = await supabase
      .from('staff')
      .select('*')
      .eq('tenant_id', userData.tenant_id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching staff:', error);
      return NextResponse.json({ error: 'Failed to fetch staff' }, { status: 500 });
    }

    return NextResponse.json({ staff });
  } catch (error) {
    console.error('Staff fetch error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

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
    const { name, email, role, phone, specialties, hourlyRate } = body;

    if (!name || !email || !role) {
      return NextResponse.json({ error: 'Name, email, and role are required' }, { status: 400 });
    }

    const validRoles = ['manager', 'head-coach', 'coach', 'front-desk'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    const { data: existingStaff } = await supabase
      .from('staff')
      .select('id')
      .eq('tenant_id', userData.tenant_id)
      .eq('email', email)
      .single();

    if (existingStaff) {
      return NextResponse.json({ error: 'Staff member with this email already exists' }, { status: 409 });
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
    };

    const { data: newStaff, error } = await supabase
      .from('staff')
      .insert(staffData)
      .select()
      .single();

    if (error) {
      console.error('Error creating staff:', error);
      return NextResponse.json({ error: 'Failed to create staff member' }, { status: 500 });
    }

    return NextResponse.json({ staff: newStaff }, { status: 201 });
  } catch (error) {
    console.error('Staff creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
