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
  
  if (!(await isAuvoraAdmin(supabase))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const { id } = await params;
  
  try {
    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', id)
      .eq('is_demo', true)
      .single();
    
    if (tenantError || !tenant) {
      return NextResponse.json({ error: 'Demo tenant not found' }, { status: 404 });
    }
    
    await supabase.from('bookings').delete().eq('tenant_id', id);
    await supabase.from('transactions').delete().eq('tenant_id', id);
    await supabase.from('leads').delete().eq('tenant_id', id);
    await supabase.from('members').delete().eq('tenant_id', id);
    await supabase.from('classes').delete().eq('tenant_id', id);
    await supabase.from('staff').delete().eq('tenant_id', id);
    
    await seedDemoData(supabase, id, tenant.demo_industry || 'fitness');
    
    await supabase
      .from('tenants')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', id);
    
    return NextResponse.json({
      success: true,
      message: 'Demo data reset successfully',
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to reset demo data' },
      { status: 500 }
    );
  }
}

async function seedDemoData(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tenantId: string,
  industry: string
) {
  const staffMembers = getStaffForIndustry(industry);
  
  const { data: insertedStaff } = await supabase
    .from('staff')
    .insert(staffMembers.map(s => ({ ...s, tenant_id: tenantId })))
    .select();

  const coachIds = insertedStaff?.filter(s => 
    s.role === 'coach' || s.role === 'head-coach' || s.role === 'instructor'
  ).map(s => s.id) || [];

  const classes = getClassesForIndustry(industry, coachIds, tenantId);
  await supabase.from('classes').insert(classes);

  const members = getMembersForIndustry(industry, tenantId);
  await supabase.from('members').insert(members);

  const leads = getLeadsForIndustry(industry, tenantId);
  await supabase.from('leads').insert(leads);
}

function getStaffForIndustry(industry: string) {
  if (industry === 'fitness') {
    return [
      { name: 'Chris Johnson', email: 'chris@demo.com', role: 'head-coach', phone: '813-555-0101' },
      { name: 'Alex Rivera', email: 'alex@demo.com', role: 'coach', phone: '813-555-0102' },
      { name: 'Jordan Martinez', email: 'jordan@demo.com', role: 'coach', phone: '813-555-0103' },
      { name: 'Taylor Anderson', email: 'taylor@demo.com', role: 'coach', phone: '813-555-0104' },
      { name: 'Sam Brown', email: 'sam@demo.com', role: 'front-desk', phone: '813-555-0107' },
    ];
  } else if (industry === 'wellness') {
    return [
      { name: 'Sarah Chen', email: 'sarah@demo.com', role: 'head-coach', phone: '813-555-0201' },
      { name: 'Maya Patel', email: 'maya@demo.com', role: 'instructor', phone: '813-555-0202' },
      { name: 'Emma Wilson', email: 'emma@demo.com', role: 'instructor', phone: '813-555-0203' },
      { name: 'Lisa Thompson', email: 'lisa@demo.com', role: 'front-desk', phone: '813-555-0204' },
    ];
  } else {
    return [
      { name: 'Dr. James Miller', email: 'james@demo.com', role: 'head-coach', phone: '813-555-0301' },
      { name: 'Prof. Emily Davis', email: 'emily@demo.com', role: 'instructor', phone: '813-555-0302' },
      { name: 'Michael Chen', email: 'michael@demo.com', role: 'instructor', phone: '813-555-0303' },
      { name: 'Rachel Green', email: 'rachel@demo.com', role: 'front-desk', phone: '813-555-0304' },
    ];
  }
}

function getClassesForIndustry(industry: string, coachIds: string[], tenantId: string) {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const classes = [];
  
  let templates;
  if (industry === 'fitness') {
    templates = [
      { name: 'Circuit Training', duration: 60, capacity: 20, location: 'Main Studio' },
      { name: 'HIIT Blast', duration: 30, capacity: 20, location: 'Main Studio' },
      { name: 'Strength & Conditioning', duration: 60, capacity: 15, location: 'Weight Room' },
      { name: 'Bootcamp', duration: 60, capacity: 25, location: 'Main Studio' },
    ];
  } else if (industry === 'wellness') {
    templates = [
      { name: 'Yoga Flow', duration: 60, capacity: 15, location: 'Zen Studio' },
      { name: 'Meditation', duration: 30, capacity: 20, location: 'Quiet Room' },
      { name: 'Pilates', duration: 60, capacity: 12, location: 'Mat Room' },
      { name: 'Sound Bath', duration: 45, capacity: 10, location: 'Healing Room' },
    ];
  } else {
    templates = [
      { name: 'Math Tutoring', duration: 60, capacity: 8, location: 'Room A' },
      { name: 'SAT Prep', duration: 90, capacity: 12, location: 'Room B' },
      { name: 'Science Lab', duration: 60, capacity: 10, location: 'Lab' },
      { name: 'Writing Workshop', duration: 60, capacity: 8, location: 'Room C' },
    ];
  }
  
  const times = ['9:00 AM', '10:00 AM', '2:00 PM', '4:00 PM', '6:00 PM'];
  
  for (const day of days) {
    for (let i = 0; i < 3; i++) {
      const template = templates[Math.floor(Math.random() * templates.length)];
      const coachId = coachIds.length > 0 ? coachIds[Math.floor(Math.random() * coachIds.length)] : null;
      
      classes.push({
        tenant_id: tenantId,
        name: template.name,
        day_of_week: day,
        time: times[i],
        duration: template.duration,
        capacity: template.capacity,
        location: template.location,
        coach_id: coachId,
      });
    }
  }
  
  return classes;
}

function getMembersForIndustry(industry: string, tenantId: string) {
  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis'];
  
  let membershipTypes;
  if (industry === 'fitness') {
    membershipTypes = ['1x-week', '2x-week', 'unlimited'];
  } else if (industry === 'wellness') {
    membershipTypes = ['monthly', 'class-pack-5', 'class-pack-10', 'unlimited'];
  } else {
    membershipTypes = ['weekly', 'monthly', 'semester'];
  }
  
  const members = [];
  for (let i = 0; i < 30; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 180));
    
    const nextPaymentDue = new Date();
    nextPaymentDue.setDate(nextPaymentDue.getDate() + Math.floor(Math.random() * 30) - 10);
    
    members.push({
      tenant_id: tenantId,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`,
      phone: `813-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      membership_type: membershipTypes[Math.floor(Math.random() * membershipTypes.length)],
      status: 'active',
      join_date: joinDate.toISOString().split('T')[0],
      payment_status: Math.random() < 0.15 ? 'overdue' : 'current',
      next_payment_due: nextPaymentDue.toISOString().split('T')[0],
    });
  }
  
  return members;
}

function getLeadsForIndustry(industry: string, tenantId: string) {
  const firstNames = ['Alex', 'Sam', 'Jordan', 'Taylor', 'Morgan', 'Casey', 'Riley', 'Quinn'];
  const lastNames = ['Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin'];
  const sources = ['website', 'instagram', 'facebook', 'walk-in', 'referral'];
  const statuses = ['new', 'contacted', 'qualified'];
  
  const leads = [];
  for (let i = 0; i < 15; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    
    leads.push({
      tenant_id: tenantId,
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}.lead${i}@example.com`,
      phone: `813-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      source: sources[Math.floor(Math.random() * sources.length)],
      status: statuses[Math.floor(Math.random() * statuses.length)],
      notes: `Interested in ${industry} services`,
    });
  }
  
  return leads;
}
