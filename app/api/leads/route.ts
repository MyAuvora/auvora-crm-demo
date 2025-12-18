import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, email, phone, business_name, industry, sub_category, message, source } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from('auvora_leads')
      .insert({
        name,
        email,
        phone: phone || null,
        business_name: business_name || null,
        industry: industry || null,
        sub_category: sub_category || null,
        notes: message || null,
        source: source || 'demo_form',
        status: 'new',
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to create lead:', error);
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, lead: data });
  } catch (error) {
    console.error('Lead API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const industry = searchParams.get('industry');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from('auvora_leads')
      .select('*')
      .order('created_at', { ascending: false });

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    if (industry && industry !== 'all') {
      query = query.eq('industry', industry);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch leads:', error);
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      );
    }

    return NextResponse.json({ leads: data });
  } catch (error) {
    console.error('Lead API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
