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

export async function GET() {
  const supabase = await createClient();
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { data: tenants, error } = await supabase
    .from('tenants')
    .select('*')
    .order('created_at', { ascending: false });
  
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json({ tenants });
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const {
      name,
      subdomain,
      custom_domain,
      logo_url,
      primary_color,
      secondary_color,
      owner_name,
      owner_email,
      business_address,
      business_phone,
      timezone,
    } = body;
    
    if (!name || !subdomain || !owner_name || !owner_email) {
      return NextResponse.json(
        { error: 'Name, subdomain, owner name, and owner email are required' },
        { status: 400 }
      );
    }
    
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name,
        subdomain: subdomain.toLowerCase().replace(/[^a-z0-9-]/g, ''),
        custom_domain: custom_domain || null,
        logo_url: logo_url || null,
        primary_color: primary_color || '#0f5257',
        secondary_color: secondary_color || '#d4af37',
        owner_name,
        owner_email,
        business_address: business_address || null,
        business_phone: business_phone || null,
        timezone: timezone || 'America/New_York',
        onboarding_status: 'provisioned',
        subscription_status: 'trial',
      })
      .select()
      .single();
    
    if (tenantError) {
      return NextResponse.json({ error: tenantError.message }, { status: 500 });
    }
    
    const tempPassword = generateTempPassword();
    
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: owner_email,
      password: tempPassword,
      email_confirm: true,
      user_metadata: {
        full_name: owner_name,
        tenant_id: tenant.id,
        role: 'owner',
      },
    });
    
    if (authError) {
      await supabase.from('tenants').delete().eq('id', tenant.id);
      return NextResponse.json({ error: authError.message }, { status: 500 });
    }
    
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        tenant_id: tenant.id,
        email: owner_email,
        full_name: owner_name,
        role: 'owner',
      });
    
    if (userError) {
      return NextResponse.json({ error: userError.message }, { status: 500 });
    }
    
    return NextResponse.json({
      tenant,
      owner: {
        email: owner_email,
        temp_password: tempPassword,
      },
      message: 'Tenant and owner account created successfully',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create tenant' },
      { status: 500 }
    );
  }
}

function generateTempPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
}
