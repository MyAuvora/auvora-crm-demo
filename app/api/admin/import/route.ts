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

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const tenantId = formData.get('tenant_id') as string;
    const dataType = formData.get('data_type') as string;
    const sourceCrm = formData.get('source_crm') as string;
    
    if (!file || !tenantId || !dataType) {
      return NextResponse.json(
        { error: 'File, tenant_id, and data_type are required' },
        { status: 400 }
      );
    }
    
    const text = await file.text();
    const rows = parseCSV(text);
    
    if (rows.length === 0) {
      return NextResponse.json({ error: 'CSV file is empty' }, { status: 400 });
    }
    
    const { data: importJob, error: jobError } = await supabase
      .from('import_jobs')
      .insert({
        tenant_id: tenantId,
        source_crm: sourceCrm || 'csv',
        status: 'processing',
        total_records: rows.length - 1,
        started_at: new Date().toISOString(),
      })
      .select()
      .single();
    
    if (jobError) {
      return NextResponse.json({ error: jobError.message }, { status: 500 });
    }
    
    const result = await importData(supabase, tenantId, dataType, rows, importJob.id);
    
    await supabase
      .from('import_jobs')
      .update({
        status: result.failed > 0 ? 'completed' : 'completed',
        imported_records: result.imported,
        failed_records: result.failed,
        error_log: result.errors,
        completed_at: new Date().toISOString(),
      })
      .eq('id', importJob.id);
    
    return NextResponse.json({
      job_id: importJob.id,
      total: rows.length - 1,
      imported: result.imported,
      failed: result.failed,
      errors: result.errors.slice(0, 10),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Import failed' },
      { status: 500 }
    );
  }
}

function parseCSV(text: string): string[][] {
  const lines = text.split('\n').filter(line => line.trim());
  return lines.map(line => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  });
}

async function importData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  dataType: string,
  rows: string[][],
  jobId: string
): Promise<{ imported: number; failed: number; errors: Array<{ row: number; error: string }> }> {
  const headers = rows[0].map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const dataRows = rows.slice(1);
  
  let imported = 0;
  let failed = 0;
  const errors: Array<{ row: number; error: string }> = [];
  
  for (let i = 0; i < dataRows.length; i++) {
    const row = dataRows[i];
    const record: Record<string, string> = {};
    
    headers.forEach((header, index) => {
      record[header] = row[index] || '';
    });
    
    try {
      switch (dataType) {
        case 'members':
          await importMember(supabase, tenantId, record);
          break;
        case 'leads':
          await importLead(supabase, tenantId, record);
          break;
        case 'staff':
          await importStaff(supabase, tenantId, record);
          break;
        case 'classes':
          await importClass(supabase, tenantId, record);
          break;
        default:
          throw new Error(`Unknown data type: ${dataType}`);
      }
      imported++;
    } catch (err) {
      failed++;
      errors.push({
        row: i + 2,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }
  
  return { imported, failed, errors };
}

async function importMember(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  record: Record<string, string>
) {
  const name = record.name || record.full_name || record.first_name + ' ' + (record.last_name || '');
  const email = record.email || record.email_address;
  
  if (!name || !email) {
    throw new Error('Name and email are required');
  }
  
  const { error } = await supabase.from('members').insert({
    tenant_id: tenantId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: record.phone || record.phone_number || null,
    membership_type: record.membership_type || record.membership || 'Standard',
    status: mapStatus(record.status) || 'active',
    join_date: parseDate(record.join_date || record.start_date) || new Date().toISOString().split('T')[0],
    payment_status: record.payment_status || 'current',
    notes: record.notes || null,
  });
  
  if (error) throw new Error(error.message);
}

async function importLead(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  record: Record<string, string>
) {
  const name = record.name || record.full_name || record.first_name + ' ' + (record.last_name || '');
  const email = record.email || record.email_address;
  
  if (!name || !email) {
    throw new Error('Name and email are required');
  }
  
  const { error } = await supabase.from('leads').insert({
    tenant_id: tenantId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: record.phone || record.phone_number || null,
    source: record.source || record.lead_source || 'Import',
    status: mapLeadStatus(record.status) || 'new',
    notes: record.notes || null,
  });
  
  if (error) throw new Error(error.message);
}

async function importStaff(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  record: Record<string, string>
) {
  const name = record.name || record.full_name || record.first_name + ' ' + (record.last_name || '');
  const email = record.email || record.email_address;
  
  if (!name || !email) {
    throw new Error('Name and email are required');
  }
  
  const { error } = await supabase.from('staff').insert({
    tenant_id: tenantId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    phone: record.phone || record.phone_number || null,
    role: mapStaffRole(record.role || record.position) || 'coach',
    hourly_rate: record.hourly_rate ? parseFloat(record.hourly_rate) : null,
    hire_date: parseDate(record.hire_date || record.start_date) || new Date().toISOString().split('T')[0],
    status: 'active',
  });
  
  if (error) throw new Error(error.message);
}

async function importClass(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  record: Record<string, string>
) {
  const name = record.name || record.class_name;
  
  if (!name) {
    throw new Error('Class name is required');
  }
  
  const { error } = await supabase.from('classes').insert({
    tenant_id: tenantId,
    name: name.trim(),
    description: record.description || null,
    day_of_week: record.day_of_week || record.day || 'Monday',
    time: record.time || record.start_time || '09:00',
    duration: parseInt(record.duration) || 60,
    capacity: parseInt(record.capacity) || 20,
    location: record.location || 'Main Studio',
  });
  
  if (error) throw new Error(error.message);
}

function mapStatus(status: string): 'active' | 'inactive' | 'frozen' | 'cancelled' {
  const s = (status || '').toLowerCase();
  if (s.includes('active')) return 'active';
  if (s.includes('inactive') || s.includes('expired')) return 'inactive';
  if (s.includes('frozen') || s.includes('hold')) return 'frozen';
  if (s.includes('cancel')) return 'cancelled';
  return 'active';
}

function mapLeadStatus(status: string): 'new' | 'contacted' | 'qualified' | 'converted' | 'lost' {
  const s = (status || '').toLowerCase();
  if (s.includes('new')) return 'new';
  if (s.includes('contact')) return 'contacted';
  if (s.includes('qualif')) return 'qualified';
  if (s.includes('convert') || s.includes('won')) return 'converted';
  if (s.includes('lost') || s.includes('closed')) return 'lost';
  return 'new';
}

function mapStaffRole(role: string): 'manager' | 'head-coach' | 'coach' | 'instructor' | 'front-desk' {
  const r = (role || '').toLowerCase();
  if (r.includes('manager')) return 'manager';
  if (r.includes('head') || r.includes('lead')) return 'head-coach';
  if (r.includes('instructor')) return 'instructor';
  if (r.includes('front') || r.includes('desk') || r.includes('reception')) return 'front-desk';
  return 'coach';
}

function parseDate(dateStr: string): string | null {
  if (!dateStr) return null;
  
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    const parts = dateStr.split(/[\/\-]/);
    if (parts.length === 3) {
      const [a, b, c] = parts.map(p => parseInt(p));
      if (a > 12) {
        return `${c}-${String(b).padStart(2, '0')}-${String(a).padStart(2, '0')}`;
      } else {
        return `${c}-${String(a).padStart(2, '0')}-${String(b).padStart(2, '0')}`;
      }
    }
    return null;
  }
  
  return date.toISOString().split('T')[0];
}
