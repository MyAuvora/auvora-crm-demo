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
    const { invoice_number, amount, due_date, status, paid_date, payment_method, notes } = body;

    if (!invoice_number || !amount || !due_date) {
      return NextResponse.json({ error: 'Invoice number, amount, and due date are required' }, { status: 400 });
    }

    const { data: invoice, error } = await supabase
      .from('tenant_invoices')
      .insert({
        tenant_id: tenantId,
        invoice_number,
        amount,
        due_date,
        status: status || 'pending',
        paid_date: paid_date || null,
        payment_method: payment_method || null,
        notes: notes || null,
      })
      .select()
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ invoice });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create invoice' },
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

  const { data: invoices, error } = await supabase
    .from('tenant_invoices')
    .select('*')
    .eq('tenant_id', tenantId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invoices });
}
