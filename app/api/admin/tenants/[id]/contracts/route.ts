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

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: tenantId } = await params;
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const body = await request.json();
    const { name, notes, signed_date, expiry_date, status, file_url, file_type, file_size } = body;

    if (!name) {
      return NextResponse.json({ error: 'Contract name is required' }, { status: 400 });
    }

    const { data: contract, error } = await supabase
      .from('tenant_contracts')
      .insert({
        tenant_id: tenantId,
        name,
        notes: notes || null,
        signed_date: signed_date || null,
        expiry_date: expiry_date || null,
        status: status || 'draft',
        file_url: file_url || null,
        file_type: file_type || null,
        file_size: file_size || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ contract });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create contract' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = await createClient();
  const { id: tenantId } = await params;
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { data: contracts, error } = await supabase
    .from('tenant_contracts')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ contracts });
}
