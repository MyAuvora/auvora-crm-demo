import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

export async function seedTenantData(tenantId: string) {
  const staffMembers = [
    { name: 'Chris Johnson', email: 'chris.johnson@example.com', role: 'head-coach', phone: '813-555-0101' },
    { name: 'Alex Rivera', email: 'alex.rivera@example.com', role: 'coach', phone: '813-555-0102' },
    { name: 'Jordan Martinez', email: 'jordan.martinez@example.com', role: 'coach', phone: '813-555-0103' },
    { name: 'Taylor Anderson', email: 'taylor.anderson@example.com', role: 'coach', phone: '813-555-0104' },
    { name: 'Jamie Wilson', email: 'jamie.wilson@example.com', role: 'coach', phone: '813-555-0105' },
    { name: 'Morgan Lee', email: 'morgan.lee@example.com', role: 'coach', phone: '813-555-0106' },
    { name: 'Sam Brown', email: 'sam.brown@example.com', role: 'front-desk', phone: '813-555-0107' },
    { name: 'Riley Davis', email: 'riley.davis@example.com', role: 'front-desk', phone: '813-555-0108' },
  ];

  const { data: insertedStaff, error: staffError } = await supabase
    .from('staff')
    .insert(staffMembers.map(s => ({ ...s, tenant_id: tenantId })))
    .select();

  if (staffError) {
    console.error('Error seeding staff:', staffError);
    return { success: false, error: staffError };
  }

  const coachIds = insertedStaff?.filter(s => s.role === 'coach' || s.role === 'head-coach').map(s => s.id) || [];

  const classTemplates = [
    { name: 'Circuit Training', duration: 60, capacity: 20, location: 'Main Studio' },
    { name: 'HIIT Blast', duration: 30, capacity: 20, location: 'Main Studio' },
    { name: 'Strength & Conditioning', duration: 60, capacity: 15, location: 'Weight Room' },
    { name: 'Bootcamp', duration: 60, capacity: 25, location: 'Main Studio' },
    { name: 'Core Power', duration: 30, capacity: 20, location: 'Main Studio' },
    { name: 'Cardio Burn', duration: 60, capacity: 20, location: 'Cardio Room' },
    { name: 'Total Body', duration: 60, capacity: 20, location: 'Main Studio' },
    { name: 'Functional Fitness', duration: 60, capacity: 15, location: 'Functional Area' },
  ];

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const times = ['6:00 AM', '7:00 AM', '8:00 AM', '9:00 AM', '12:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'];

  const classes = [];
  for (const day of days) {
    const dayTimes = day === 'Saturday' || day === 'Sunday' 
      ? ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM']
      : times;
    
    for (const time of dayTimes) {
      const template = classTemplates[Math.floor(Math.random() * classTemplates.length)];
      const coachId = coachIds[Math.floor(Math.random() * coachIds.length)];
      
      classes.push({
        tenant_id: tenantId,
        name: template.name,
        day_of_week: day,
        time: time,
        duration: template.duration,
        capacity: template.capacity,
        location: template.location,
        coach_id: coachId,
      });
    }
  }

  const { error: classError } = await supabase
    .from('classes')
    .insert(classes);

  if (classError) {
    console.error('Error seeding classes:', classError);
    return { success: false, error: classError };
  }

  const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
  const membershipTypes = ['1x-week', '2x-week', 'unlimited'];

  const members = [];
  for (let i = 0; i < 50; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i}@example.com`;
    
    const joinDate = new Date();
    joinDate.setDate(joinDate.getDate() - Math.floor(Math.random() * 365));
    
    const nextPaymentDue = new Date();
    nextPaymentDue.setDate(nextPaymentDue.getDate() + Math.floor(Math.random() * 30) - 15);
    
    const isOverdue = Math.random() < 0.15;
    
    members.push({
      tenant_id: tenantId,
      name,
      email,
      phone: `813-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      membership_type: membershipTypes[Math.floor(Math.random() * membershipTypes.length)],
      status: 'active',
      join_date: joinDate.toISOString().split('T')[0],
      payment_status: isOverdue ? 'overdue' : 'current',
      next_payment_due: nextPaymentDue.toISOString().split('T')[0],
    });
  }

  const { error: memberError } = await supabase
    .from('members')
    .insert(members);

  if (memberError) {
    console.error('Error seeding members:', memberError);
    return { success: false, error: memberError };
  }

  const leadSources = ['website', 'instagram', 'facebook', 'walk-in', 'referral'];
  const leadStatuses = ['new', 'contacted', 'qualified'];

  const leads = [];
  for (let i = 0; i < 20; i++) {
    const firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    const lastName = lastNames[Math.floor(Math.random() * lastNames.length)];
    const name = `${firstName} ${lastName}`;
    const email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}.lead${i}@example.com`;
    
    leads.push({
      tenant_id: tenantId,
      name,
      email,
      phone: `813-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
      source: leadSources[Math.floor(Math.random() * leadSources.length)],
      status: leadStatuses[Math.floor(Math.random() * leadStatuses.length)],
      notes: 'Interested in membership options',
    });
  }

  const { error: leadError } = await supabase
    .from('leads')
    .insert(leads);

  if (leadError) {
    console.error('Error seeding leads:', leadError);
    return { success: false, error: leadError };
  }

  return { success: true };
}

export async function checkTenantHasData(tenantId: string): Promise<boolean> {
  const { count, error } = await supabase
    .from('members')
    .select('*', { count: 'exact', head: true })
    .eq('tenant_id', tenantId);

  if (error) {
    console.error('Error checking tenant data:', error);
    return false;
  }

  return (count || 0) > 0;
}
