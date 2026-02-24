import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const resendApiKey = process.env.RESEND_API_KEY;
const notificationEmail = process.env.NOTIFICATION_EMAIL || 'Patrick_Metzger@myauvora.com';

// Helper function to escape HTML and prevent injection attacks
function escapeHtml(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const { name, email, phone, business_name, industry, sub_category, message, source } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'Name and email are required' },
        { status: 400, headers: corsHeaders }
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
        { status: 500, headers: corsHeaders }
      );
    }

    // Send email notification
    if (resendApiKey) {
      try {
        const resend = new Resend(resendApiKey);
        // Escape all user inputs to prevent HTML injection
        const safeName = escapeHtml(name);
        const safeEmail = escapeHtml(email);
        const safePhone = escapeHtml(phone);
        const safeBusinessName = escapeHtml(business_name);
        const safeIndustry = escapeHtml(industry);
        const safeMessage = escapeHtml(message);
        
        await resend.emails.send({
          from: 'Auvora Leads <leads@myauvora.com>',
          to: notificationEmail,
          subject: `New Lead: ${name} - ${business_name || 'No Business Name'}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background: linear-gradient(135deg, #0d9488 0%, #14b8a6 100%); padding: 20px; border-radius: 10px 10px 0 0;">
                <h1 style="color: white; margin: 0;">New Demo Request</h1>
              </div>
              <div style="background: #f8fafc; padding: 20px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 10px 10px;">
                <h2 style="color: #0d9488; margin-top: 0;">Contact Information</h2>
                <p><strong>Name:</strong> ${safeName}</p>
                <p><strong>Email:</strong> <a href="mailto:${safeEmail}">${safeEmail}</a></p>
                ${safePhone ? `<p><strong>Phone:</strong> ${safePhone}</p>` : ''}
                ${safeBusinessName ? `<p><strong>Business:</strong> ${safeBusinessName}</p>` : ''}
                ${safeIndustry ? `<p><strong>Industry:</strong> ${safeIndustry}</p>` : ''}
                
                ${safeMessage ? `
                <h2 style="color: #0d9488;">What they're looking to improve</h2>
                <p style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #0d9488;">${safeMessage}</p>
                ` : ''}
                
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="color: #64748b; font-size: 12px;">This lead was submitted via the Auvora website demo form.</p>
              </div>
            </div>
          `,
        });
        console.log('Email notification sent successfully');
      } catch (emailError) {
        console.error('Failed to send email notification:', emailError);
        // Don't fail the request if email fails - lead is already saved
      }
    }

    return NextResponse.json({ success: true, lead: data }, { headers: corsHeaders });
  } catch (error) {
    console.error('Lead API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
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
