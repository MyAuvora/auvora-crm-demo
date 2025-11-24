import { Member, ClassPackClient, Lead, Staff, Class, Promotion, Product } from '@/lib/types';

const tampaZipCodes = ['33602', '33603', '33606', '33607', '33609', '33611', '33612', '33613', '33614', '33615'];

const firstNames = ['James', 'Mary', 'John', 'Patricia', 'Robert', 'Jennifer', 'Michael', 'Linda', 'William', 'Elizabeth', 'David', 'Barbara', 'Richard', 'Susan', 'Joseph', 'Jessica', 'Thomas', 'Sarah', 'Charles', 'Karen', 'Christopher', 'Nancy', 'Daniel', 'Lisa', 'Matthew', 'Betty', 'Anthony', 'Margaret', 'Mark', 'Sandra', 'Donald', 'Ashley', 'Steven', 'Kimberly', 'Paul', 'Emily', 'Andrew', 'Donna', 'Joshua', 'Michelle', 'Kenneth', 'Carol', 'Kevin', 'Amanda', 'Brian', 'Dorothy', 'George', 'Melissa', 'Timothy', 'Deborah'];

const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas', 'Taylor', 'Moore', 'Jackson', 'Martin', 'Lee', 'Perez', 'Thompson', 'White', 'Harris', 'Sanchez', 'Clark', 'Ramirez', 'Lewis', 'Robinson', 'Walker', 'Young', 'Allen', 'King', 'Wright', 'Scott', 'Torres', 'Nguyen', 'Hill', 'Flores', 'Green', 'Adams', 'Nelson', 'Baker', 'Hall', 'Rivera', 'Campbell', 'Mitchell', 'Carter', 'Roberts'];

function randomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysAgo: number): string {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date.toISOString().split('T')[0];
}

function generateName(): string {
  return `${randomItem(firstNames)} ${randomItem(lastNames)}`;
}

function generateEmail(name: string): string {
  return `${name.toLowerCase().replace(' ', '.')}@email.com`;
}

function generatePhone(): string {
  return `813-${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`;
}

export function generateMembers(): Member[] {
  const members: Member[] = [];
  const membershipTypes: ('1x-week' | '2x-week' | 'unlimited')[] = ['1x-week', '2x-week', 'unlimited'];
  
  for (let i = 0; i < 150; i++) {
    const name = generateName();
    const joinDate = randomDate(365);
    const joinDateObj = new Date(joinDate);
    
    const lastPaymentDate = new Date(joinDateObj);
    lastPaymentDate.setMonth(lastPaymentDate.getMonth() + Math.floor((new Date().getTime() - joinDateObj.getTime()) / (30 * 24 * 60 * 60 * 1000)));
    
    const nextPaymentDue = new Date(lastPaymentDate);
    nextPaymentDue.setMonth(nextPaymentDue.getMonth() + 1);
    
    const isOverdue = Math.random() < 0.15;
    const paymentStatus: 'current' | 'overdue' = isOverdue ? 'overdue' : 'current';
    
    if (isOverdue) {
      nextPaymentDue.setDate(nextPaymentDue.getDate() - Math.floor(Math.random() * 30 + 5)); // 5-35 days overdue
    }
    
    members.push({
      id: `member-${i + 1}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(),
      membershipType: randomItem(membershipTypes),
      status: 'active',
      lastVisit: randomDate(30),
      zipCode: randomItem(tampaZipCodes),
      location: 'athletic-club',
      joinDate,
      visitsLast30Days: Math.floor(Math.random() * 20) + 1,
      paymentStatus,
      lastPaymentDate: lastPaymentDate.toISOString().split('T')[0],
      nextPaymentDue: nextPaymentDue.toISOString().split('T')[0]
    });
  }
  
  return members;
}

export function generateClassPackClients(): ClassPackClient[] {
  const clients: ClassPackClient[] = [];
  const packTypes: ('5-pack' | '10-pack' | '20-pack')[] = ['5-pack', '10-pack', '20-pack'];
  
  for (let i = 0; i < 50; i++) {
    const name = generateName();
    const packType = randomItem(packTypes);
    const totalClasses = parseInt(packType.split('-')[0]);
    const remainingClasses = Math.floor(Math.random() * totalClasses);
    
    clients.push({
      id: `pack-ac-${i + 1}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(),
      packType,
      totalClasses,
      remainingClasses,
      zipCode: randomItem(tampaZipCodes),
      location: 'athletic-club',
      purchaseDate: randomDate(90)
    });
  }
  
  for (let i = 0; i < 50; i++) {
    const name = generateName();
    const packType = randomItem(packTypes);
    const totalClasses = parseInt(packType.split('-')[0]);
    const remainingClasses = Math.floor(Math.random() * totalClasses);
    
    clients.push({
      id: `pack-ds-${i + 1}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(),
      packType,
      totalClasses,
      remainingClasses,
      zipCode: randomItem(tampaZipCodes),
      location: 'dance-studio',
      purchaseDate: randomDate(90)
    });
  }
  
  return clients;
}

export function generateLeads(): Lead[] {
  const leads: Lead[] = [];
  const statuses: ('cancelled' | 'trial-no-join' | 'new-lead')[] = ['cancelled', 'trial-no-join', 'new-lead'];
  const sources: ('website' | 'instagram' | 'facebook' | 'walk-in')[] = ['website', 'instagram', 'facebook', 'walk-in'];
  
  const notes = [
    'Interested in morning classes',
    'Looking for beginner-friendly options',
    'Wants to try a free class first',
    'Asked about pricing',
    'Referred by a friend',
    'Interested in personal training',
    'Looking for evening classes',
    'Wants to bring a friend'
  ];
  
  for (let i = 0; i < 100; i++) {
    const name = generateName();
    leads.push({
      id: `lead-${i + 1}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(),
      status: randomItem(statuses),
      source: randomItem(sources),
      createdDate: randomDate(90),
      location: 'athletic-club',
      notes: randomItem(notes)
    });
  }
  
  return leads;
}

export function generateStaff(): Staff[] {
  const staff: Staff[] = [];
  
  const coachNames = ['Alex Rivera', 'Jordan Martinez', 'Casey Thompson', 'Morgan Lee', 'Taylor Anderson', 'Jamie Wilson'];
  const frontDeskNames = ['Sam Brown', 'Riley Davis', 'Avery Garcia'];
  const instructorNames = ['Quinn Rodriguez', 'Skylar Hernandez', 'Dakota Lopez', 'Cameron Gonzalez', 'Parker Torres'];
  
  const specialties = ['strength', 'conditioning', 'beginners', 'advanced', 'HIIT', 'endurance'];
  const danceStyles = ['Zumba', 'Salsa', 'Hip-Hop'];
  
  coachNames.forEach((name, i) => {
    staff.push({
      id: `coach-${i + 1}`,
      name,
      email: generateEmail(name),
      role: 'coach',
      location: 'athletic-club',
      specialties: [randomItem(specialties), randomItem(specialties)]
    });
  });
  
  frontDeskNames.forEach((name, i) => {
    staff.push({
      id: `desk-${i + 1}`,
      name,
      email: generateEmail(name),
      role: 'front-desk',
      location: 'athletic-club'
    });
  });
  
  instructorNames.forEach((name, i) => {
    staff.push({
      id: `instructor-${i + 1}`,
      name,
      email: generateEmail(name),
      role: 'instructor',
      location: 'dance-studio',
      styles: [randomItem(danceStyles), randomItem(danceStyles)]
    });
  });
  
  return staff;
}

export function generateClasses(): Class[] {
  const classes: Class[] = [];
  const coaches = generateStaff().filter(s => s.role === 'coach');
  const instructors = generateStaff().filter(s => s.role === 'instructor');
  
  const athleticClassNames = ['Circuit Training', 'HIIT Blast', 'Strength & Conditioning', 'Bootcamp', 'Core Power', 'Cardio Burn', 'Total Body'];
  const danceClassTypes = ['Zumba', 'Salsa', 'Hip-Hop'];
  
  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const athleticTimes = ['6:00 AM', '7:00 AM', '9:00 AM', '12:00 PM', '5:00 PM', '6:00 PM', '7:00 PM'];
  const saturdayTimes = ['9:00 AM', '10:00 AM'];
  const danceTimes = ['6:00 PM', '7:00 PM', '8:00 PM'];
  
  let classId = 1;
  
  weekdays.forEach(day => {
    athleticTimes.forEach(time => {
      const coach = randomItem(coaches);
      const duration = Math.random() > 0.5 ? 30 : 60;
      const capacity = 20;
      const bookedCount = Math.floor(Math.random() * capacity);
      
      classes.push({
        id: `class-ac-${classId++}`,
        name: randomItem(athleticClassNames),
        type: 'Circuit Training',
        duration,
        dayOfWeek: day,
        time,
        coachId: coach.id,
        capacity,
        location: 'athletic-club',
        bookedCount,
        attendees: []
      });
    });
  });
  
  saturdayTimes.forEach(time => {
    const coach = randomItem(coaches);
    const duration = Math.random() > 0.5 ? 30 : 60;
    const capacity = 20;
    const bookedCount = Math.floor(Math.random() * capacity);
    
    classes.push({
      id: `class-ac-${classId++}`,
      name: randomItem(athleticClassNames),
      type: 'Circuit Training',
      duration,
      dayOfWeek: 'Saturday',
      time,
      coachId: coach.id,
      capacity,
      location: 'athletic-club',
      bookedCount,
      attendees: []
    });
  });
  
  weekdays.forEach(day => {
    danceTimes.forEach(time => {
      const instructor = randomItem(instructors);
      const classType = randomItem(danceClassTypes);
      const capacity = 25;
      const bookedCount = Math.floor(Math.random() * capacity);
      
      classes.push({
        id: `class-ds-${classId++}`,
        name: classType,
        type: classType,
        duration: 60,
        dayOfWeek: day,
        time,
        coachId: instructor.id,
        capacity,
        location: 'dance-studio',
        bookedCount,
        attendees: []
      });
    });
  });
  
  return classes;
}

export function generatePromotions(): Promotion[] {
  return [
    {
      id: 'promo-1',
      name: 'New Year Kickstart',
      type: 'New Member',
      status: 'ended',
      startDate: '2025-01-01',
      endDate: '2025-01-31',
      signups: 45,
      revenue: 6750,
      location: 'athletic-club'
    },
    {
      id: 'promo-2',
      name: 'Spring Into Fitness',
      type: 'Reactivation',
      status: 'active',
      startDate: '2025-03-01',
      endDate: '2025-03-31',
      signups: 23,
      revenue: 3450,
      location: 'athletic-club'
    },
    {
      id: 'promo-3',
      name: 'Dance Your Way to Summer',
      type: 'New Member',
      status: 'planned',
      startDate: '2025-05-01',
      endDate: '2025-05-31',
      signups: 0,
      revenue: 0,
      location: 'dance-studio'
    }
  ];
}

export function generateProducts(): Product[] {
  return [
    { id: 'prod-1', name: 'Water Bottle', category: 'Retail', price: 15, stock: 45, location: 'athletic-club' },
    { id: 'prod-2', name: 'Gym Towel', category: 'Retail', price: 20, stock: 30, location: 'athletic-club' },
    { id: 'prod-3', name: 'The LAB T-Shirt', category: 'Apparel', price: 25, stock: 8, location: 'athletic-club' },
    { id: 'prod-4', name: 'The LAB Tank Top', category: 'Apparel', price: 22, stock: 12, location: 'athletic-club' },
    { id: 'prod-5', name: 'Resistance Bands', category: 'Equipment', price: 18, stock: 25, location: 'athletic-club' },
    { id: 'prod-6', name: 'Protein Shake', category: 'Nutrition', price: 8, stock: 3, location: 'athletic-club' },
    { id: 'prod-7', name: 'Energy Bar', category: 'Nutrition', price: 4, stock: 50, location: 'athletic-club' },
    { id: 'prod-8', name: 'Dance Studio T-Shirt', category: 'Apparel', price: 25, stock: 15, location: 'dance-studio' },
    { id: 'prod-9', name: 'Water Bottle', category: 'Retail', price: 15, stock: 20, location: 'dance-studio' },
    { id: 'prod-10', name: 'Dance Shoes', category: 'Equipment', price: 45, stock: 6, location: 'dance-studio' }
  ];
}

export const members = generateMembers();
export const classPackClients = generateClassPackClients();
export const leads = generateLeads();
export const staff = generateStaff();
export const classes = generateClasses();
export const promotions = generatePromotions();
export const products = generateProducts();
