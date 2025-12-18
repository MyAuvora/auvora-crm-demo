import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

async function isAuvoraAdmin(supabase: Awaited<ReturnType<typeof createClient>>) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return false;
  
  const { data: admin } = await supabase
    .from('auvora_admins')
    .select('id')
    .eq('id', user.id)
    .single();
  
  return !!admin;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', id)
    .single();
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  const { data: users } = await supabase
    .from('users')
    .select('*')
    .eq('tenant_id', id);
  
  const { data: stats } = await supabase
    .from('members')
    .select('id', { count: 'exact' })
    .eq('tenant_id', id);
  
  return NextResponse.json({
    tenant,
    users: users || [],
    member_count: stats?.length || 0,
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const allowedFields = [
      'name',
      'subdomain',
      'custom_domain',
      'logo_url',
      'primary_color',
      'secondary_color',
      'business_address',
      'business_phone',
      'timezone',
      'onboarding_status',
      'subscription_status',
    ];
    
    const updates: Record<string, string | null> = {};
    for (const field of allowedFields) {
      if (field in body) {
        updates[field] = body[field];
      }
    }
    
    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }
    
    const { data: tenant, error } = await supabase
      .from('tenants')
      .update(updates)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    
    return NextResponse.json({ tenant });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to update tenant' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id } = await params;
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { error } = await supabase
    .from('tenants')
    .delete()
    .eq('id', id);
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ message: 'Tenant deleted successfully' });
}
