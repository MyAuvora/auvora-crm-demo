import { Member, ClassPackClient, DropInClient, Lead, Staff, Class, Promotion, Product, Goal, Note, SubstitutionRequest, TimeOffRequest, CoachLeadInteraction, StaffSettings, StaffShift } from '@/lib/types';

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
  
  for (let i = 0; i < 20; i++) {
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
  
  for (let i = 0; i < 15; i++) {
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

export function generateDropInClients(): DropInClient[] {
  const clients: DropInClient[] = [];
  
  for (let i = 0; i < 30; i++) {
    const name = generateName();
    const firstVisit = randomDate(180);
    const lastVisit = randomDate(30);
    const totalVisits = Math.floor(Math.random() * 15) + 1;
    
    clients.push({
      id: `dropin-ac-${i + 1}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(),
      totalVisits,
      lastVisit,
      zipCode: randomItem(tampaZipCodes),
      location: 'athletic-club',
      firstVisit
    });
  }
  
  for (let i = 0; i < 20; i++) {
    const name = generateName();
    const firstVisit = randomDate(180);
    const lastVisit = randomDate(30);
    const totalVisits = Math.floor(Math.random() * 12) + 1;
    
    clients.push({
      id: `dropin-ds-${i + 1}`,
      name,
      email: generateEmail(name),
      phone: generatePhone(),
      totalVisits,
      lastVisit,
      zipCode: randomItem(tampaZipCodes),
      location: 'dance-studio',
      firstVisit
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
  
  const headCoachNames = ['Chris Johnson', 'Pat Williams'];
  const coachNames = ['Alex Rivera', 'Jordan Martinez', 'Casey Thompson', 'Morgan Lee', 'Taylor Anderson', 'Jamie Wilson'];
  const frontDeskNames = ['Sam Brown', 'Riley Davis', 'Avery Garcia', 'Jessica Chen'];
  const instructorNames = ['Quinn Rodriguez', 'Skylar Hernandez', 'Dakota Lopez', 'Cameron Gonzalez', 'Parker Torres'];
  
  const specialties = ['strength', 'conditioning', 'beginners', 'advanced', 'HIIT', 'endurance'];
  const danceStyles = ['Zumba', 'Salsa', 'Hip-Hop'];
  
  staff.push({
    id: 'head-coach-1',
    name: headCoachNames[0],
    email: generateEmail(headCoachNames[0]),
    role: 'head-coach',
    location: 'athletic-club',
    specialties: ['leadership', 'program-design', 'strength', 'conditioning']
  });
  
  staff.push({
    id: 'head-coach-2',
    name: headCoachNames[1],
    email: generateEmail(headCoachNames[1]),
    role: 'head-coach',
    location: 'dance-studio',
    styles: ['choreography', 'performance', 'Salsa', 'Hip-Hop']
  });
  
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
  const coaches = generateStaff().filter(s => s.role === 'coach' || s.role === 'head-coach');
  const instructors = generateStaff().filter(s => s.role === 'instructor' || s.role === 'head-coach');
  
  const athleticClassNames = ['Circuit Training', 'HIIT Blast', 'Strength & Conditioning', 'Bootcamp', 'Core Power', 'Cardio Burn', 'Total Body', 'Functional Fitness', 'Athletic Performance', 'CrossFit'];
  const danceClassTypes = ['Zumba', 'Salsa', 'Hip-Hop', 'Contemporary', 'Ballet', 'Jazz', 'Bachata', 'Ballroom'];
  
  const allDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  
  const athleticTimes = [
    '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '8:00 AM', '9:00 AM', '10:00 AM', 
    '11:00 AM', '12:00 PM', '1:00 PM', '4:30 PM', '5:00 PM', '5:30 PM', '6:00 PM', 
    '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM'
  ];
  const danceTimes = ['5:00 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'];
  
  let classId = 1;
  
  const acCoaches = coaches.filter(c => c.location === 'athletic-club');
  allDays.forEach(day => {
    const timesForDay = day === 'Saturday' || day === 'Sunday' 
      ? ['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM']
      : athleticTimes;
    
    timesForDay.forEach(time => {
      const coach = randomItem(acCoaches);
      const className = randomItem(athleticClassNames);
      const duration = className === 'HIIT Blast' || className === 'Core Power' ? 30 : 60;
      const capacity = 20;
      
      classes.push({
        id: `class-ac-${classId++}`,
        name: className,
        type: className,
        duration,
        dayOfWeek: day,
        time,
        coachId: coach.id,
        capacity,
        location: 'athletic-club',
        bookedCount: 0,
        attendees: []
      });
    });
  });
  
  const dsInstructors = instructors.filter(i => i.location === 'dance-studio');
  allDays.forEach(day => {
    const timesForDay = day === 'Saturday' || day === 'Sunday'
      ? ['10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM']
      : danceTimes;
    
    timesForDay.forEach(time => {
      const instructor = randomItem(dsInstructors);
      const classType = randomItem(danceClassTypes);
      const capacity = 25;
      
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
        bookedCount: 0,
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

export function generateGoals(): Goal[] {
  const goals: Goal[] = [];
  const members = generateMembers();
  const staff = generateStaff().filter(s => s.role === 'coach');
  
  const goalTemplates = [
    { category: 'weight-loss' as const, title: 'Lose 10 pounds', description: 'Achieve healthy weight loss through consistent training and nutrition', startValue: '180', targetValue: '170', units: 'lbs' },
    { category: 'weight-loss' as const, title: 'Lose 20 pounds', description: 'Long-term weight loss goal with sustainable habits', startValue: '200', targetValue: '180', units: 'lbs' },
    { category: 'strength' as const, title: 'Increase bench press by 20%', description: 'Build upper body strength progressively', startValue: '135', targetValue: '162', units: 'lbs' },
    { category: 'strength' as const, title: 'Complete 10 pull-ups', description: 'Develop back and arm strength', startValue: '3', targetValue: '10', units: 'reps' },
    { category: 'attendance' as const, title: 'Attend 3x per week', description: 'Build consistent training habit', startValue: '1', targetValue: '3', units: 'days/week' },
    { category: 'attendance' as const, title: 'Attend 4x per week', description: 'Increase training frequency', startValue: '2', targetValue: '4', units: 'days/week' },
    { category: 'mobility' as const, title: 'Touch toes without bending knees', description: 'Improve hamstring flexibility', startValue: '', targetValue: '', units: '' },
    { category: 'mobility' as const, title: 'Full squat depth', description: 'Achieve proper squat form and mobility', startValue: '', targetValue: '', units: '' },
    { category: 'rehab' as const, title: 'Return to training post-injury', description: 'Safely rebuild strength and mobility after knee injury', startValue: '', targetValue: '', units: '' },
    { category: 'strength' as const, title: 'Deadlift 200 pounds', description: 'Build lower body and back strength', startValue: '135', targetValue: '200', units: 'lbs' },
  ];
  
  for (let i = 0; i < 12; i++) {
    const member = members[i];
    const coach = randomItem(staff);
    const template = randomItem(goalTemplates);
    const daysAgo = Math.floor(Math.random() * 60);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    
    const targetDate = new Date(createdDate);
    targetDate.setDate(targetDate.getDate() + 90);
    
    const isCompleted = Math.random() < 0.3;
    const status = isCompleted ? 'completed' as const : 'active' as const;
    const progress = isCompleted ? 100 : Math.floor(Math.random() * 70) + 10;
    
    const currentValue = template.startValue && template.targetValue ? 
      (parseInt(template.startValue) + (parseInt(template.targetValue) - parseInt(template.startValue)) * (progress / 100)).toString() : 
      '';
    
    goals.push({
      id: `goal-${i + 1}`,
      memberId: member.id,
      title: template.title,
      description: template.description,
      category: template.category,
      targetDate: targetDate.toISOString().split('T')[0],
      startValue: template.startValue,
      targetValue: template.targetValue,
      currentValue,
      units: template.units,
      status,
      progress,
      assignedCoach: coach.id,
      memberVisible: true,
      privateNotes: Math.random() < 0.5 ? 'Client is very motivated and consistent' : '',
      createdDate: createdDate.toISOString(),
      updatedDate: new Date().toISOString(),
      completedDate: isCompleted ? new Date().toISOString() : undefined,
    });
  }
  
  return goals;
}

export function generateNotes(): Note[] {
  const notes: Note[] = [];
  const members = generateMembers();
  const staff = generateStaff().filter(s => s.role === 'coach');
  
  const noteTemplates = [
    { type: 'session' as const, title: 'Great Training Session', content: 'Focus: Upper body strength\nExercises completed: Bench press, rows, shoulder press\nRPE: 8/10\nNotes: Client showed excellent form and pushed hard today. Ready to increase weight next session.' },
    { type: 'session' as const, title: 'Lower Body Focus', content: 'Focus: Legs and core\nExercises completed: Squats, deadlifts, lunges, planks\nRPE: 9/10\nNotes: Client struggled with squat depth but improved throughout the session.' },
    { type: 'assessment' as const, title: 'Monthly Fitness Assessment', content: 'Strengths: Cardiovascular endurance has improved significantly\nAreas for improvement: Core stability, upper body strength\nRecommendations: Add 2 core-focused sessions per week' },
    { type: 'injury' as const, title: 'Knee Discomfort', content: 'Injury: Right knee slight discomfort during squats\nStatus: Minor, no swelling\nModifications needed: Reduce squat depth, avoid jumping movements\nNext steps: Monitor for 1 week, ice after workouts' },
    { type: 'nutrition' as const, title: 'Nutrition Check-in', content: 'Current habits: Eating 3 meals per day, drinking plenty of water\nChallenges: Late night snacking, weekend overeating\nRecommendations: Meal prep on Sundays, keep healthy snacks available' },
    { type: 'general' as const, title: 'Progress Update', content: 'Client is making excellent progress toward their goals. Attendance has been consistent at 3-4x per week. Energy levels are up and they report feeling stronger.' },
    { type: 'session' as const, title: 'HIIT Workout', content: 'Focus: Cardio and conditioning\nExercises completed: Burpees, mountain climbers, jump rope, kettlebell swings\nRPE: 9/10\nNotes: Client kept up with the pace well. Heart rate recovery is improving.' },
    { type: 'assessment' as const, title: 'Initial Assessment', content: 'Strengths: Good mobility, motivated mindset\nAreas for improvement: Overall strength, endurance\nRecommendations: Start with 2-3 sessions per week, focus on compound movements' },
  ];
  
  for (let i = 0; i < 20; i++) {
    const member = members[i % 12];
    const coach = randomItem(staff);
    const template = randomItem(noteTemplates);
    const daysAgo = Math.floor(Math.random() * 45);
    const createdDate = new Date();
    createdDate.setDate(createdDate.getDate() - daysAgo);
    
    const visibilityOptions: ('private' | 'team' | 'member')[] = ['private', 'team', 'member'];
    const visibility = template.type === 'injury' ? 'team' : randomItem(visibilityOptions);
    
    notes.push({
      id: `note-${i + 1}`,
      memberId: member.id,
      type: template.type,
      title: template.title,
      content: template.content,
      authorId: coach.id,
      authorName: coach.name,
      visibility,
      createdDate: createdDate.toISOString(),
      updatedDate: createdDate.toISOString(),
    });
  }
  
  return notes;
}

export const members = generateMembers();
export const classPackClients = generateClassPackClients();
export const dropInClients = generateDropInClients();
export const leads = generateLeads();
export const staff = generateStaff();
export const classes = generateClasses();
export const promotions = generatePromotions();
export const products = generateProducts();
export const goals = generateGoals();
export const notes = generateNotes();

export function generateCoachLeadInteractions(): CoachLeadInteraction[] {
  const interactions: CoachLeadInteraction[] = [];
  const coaches = staff.filter(s => s.role === 'coach');
  const allLeads = leads;
  const allClasses = classes;
  
  for (let i = 0; i < 60; i++) {
    const lead = randomItem(allLeads);
    const coach = randomItem(coaches);
    const classItem = allClasses.find(c => c.coachId === coach.id);
    
    if (classItem) {
      const interactionDate = randomDate(90);
      const converted = Math.random() < 0.25;
      
      interactions.push({
        id: `coach-lead-${i + 1}`,
        leadId: lead.id,
        coachId: coach.id,
        classId: classItem.id,
        interactionDate,
        interactionType: 'trial-class',
        converted,
        conversionDate: converted ? new Date(new Date(interactionDate).getTime() + Math.random() * 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : undefined,
        location: lead.location,
      });
    }
  }
  
  return interactions;
}

export function generateSubstitutionRequests(): SubstitutionRequest[] {
  const requests: SubstitutionRequest[] = [];
  const coaches = staff.filter(s => s.role === 'coach');
  const allClasses = classes;
  
  for (let i = 0; i < 3; i++) {
    const requestingCoach = randomItem(coaches);
    const classItem = allClasses.find(c => c.coachId === requestingCoach.id);
    
    if (classItem) {
      const type: 'switch' | 'available' = i % 2 === 0 ? 'switch' : 'available';
      const targetCoach = type === 'switch' ? coaches.find(c => c.id !== requestingCoach.id) : undefined;
      
      requests.push({
        id: `sub-req-${i + 1}`,
        classId: classItem.id,
        className: classItem.name,
        classDate: new Date(Date.now() + (i + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        classTime: classItem.time,
        requestingCoachId: requestingCoach.id,
        requestingCoachName: requestingCoach.name,
        type,
        targetCoachId: targetCoach?.id,
        targetCoachName: targetCoach?.name,
        status: 'pending',
        reason: type === 'switch' ? 'Personal appointment' : 'Available for coverage',
        createdDate: new Date(Date.now() - Math.random() * 3 * 24 * 60 * 60 * 1000).toISOString(),
        location: classItem.location,
      });
    }
  }
  
  return requests;
}

export function generateTimeOffRequests(): TimeOffRequest[] {
  const requests: TimeOffRequest[] = [];
  const coaches = staff.filter(s => s.role === 'coach');
  const allClasses = classes;
  
  for (let i = 0; i < 2; i++) {
    const coach = randomItem(coaches);
    const startDate = new Date(Date.now() + (i + 2) * 14 * 24 * 60 * 60 * 1000);
    const endDate = new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const affectedClasses = allClasses
      .filter(c => c.coachId === coach.id)
      .slice(0, 3)
      .map(c => c.id);
    
    requests.push({
      id: `time-off-${i + 1}`,
      coachId: coach.id,
      coachName: coach.name,
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      reason: i === 0 ? 'Family vacation' : 'Medical appointment',
      status: 'pending',
      affectedClassIds: affectedClasses,
      createdDate: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000).toISOString(),
      location: coach.location,
    });
  }
  
  return requests;
}

export function generateStaffSettings(): StaffSettings[] {
  return staff.map(s => ({
    staffId: s.id,
    posAccess: true, // Default to true for all staff
    location: s.location,
  }));
}

export function generateStaffShifts(): StaffShift[] {
  const shifts: StaffShift[] = [];
  
  const tampaFrontDesk = staff.filter(s => s.location === 'athletic-club' && s.role === 'front-desk');
  const stPeteFrontDesk = staff.filter(s => s.location === 'dance-studio' && s.role === 'front-desk');
  
  if (tampaFrontDesk.length > 0) {
    shifts.push({
      id: `shift-tampa-morning-${Date.now()}`,
      location: 'athletic-club',
      assignedStaffId: tampaFrontDesk[0].id,
      assignedStaffName: tampaFrontDesk[0].name,
      templateType: 'front-desk',
      notes: 'Morning front desk coverage',
      recurrence: {
        type: 'weekly',
        dayOfWeek: 1, // Monday
        startTime: '6:00 AM',
        endTime: '2:00 PM',
      },
      status: 'scheduled',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    });
    
    shifts.push({
      id: `shift-tampa-morning-tue-${Date.now()}`,
      location: 'athletic-club',
      assignedStaffId: tampaFrontDesk[0].id,
      assignedStaffName: tampaFrontDesk[0].name,
      templateType: 'front-desk',
      notes: 'Morning front desk coverage',
      recurrence: {
        type: 'weekly',
        dayOfWeek: 2, // Tuesday
        startTime: '6:00 AM',
        endTime: '2:00 PM',
      },
      status: 'scheduled',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    });
    
    shifts.push({
      id: `shift-tampa-morning-wed-${Date.now()}`,
      location: 'athletic-club',
      assignedStaffId: tampaFrontDesk[0].id,
      assignedStaffName: tampaFrontDesk[0].name,
      templateType: 'front-desk',
      notes: 'Morning front desk coverage',
      recurrence: {
        type: 'weekly',
        dayOfWeek: 3, // Wednesday
        startTime: '6:00 AM',
        endTime: '2:00 PM',
      },
      status: 'scheduled',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    });
    
    if (tampaFrontDesk.length > 1) {
      shifts.push({
        id: `shift-tampa-afternoon-${Date.now()}`,
        location: 'athletic-club',
        assignedStaffId: tampaFrontDesk[1].id,
        assignedStaffName: tampaFrontDesk[1].name,
        templateType: 'front-desk',
        notes: 'Afternoon front desk coverage',
        recurrence: {
          type: 'weekly',
          dayOfWeek: 1, // Monday
          startTime: '2:00 PM',
          endTime: '9:00 PM',
        },
        status: 'scheduled',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      });
      
      shifts.push({
        id: `shift-tampa-afternoon-thu-${Date.now()}`,
        location: 'athletic-club',
        assignedStaffId: tampaFrontDesk[1].id,
        assignedStaffName: tampaFrontDesk[1].name,
        templateType: 'front-desk',
        notes: 'Afternoon front desk coverage',
        recurrence: {
          type: 'weekly',
          dayOfWeek: 4, // Thursday
          startTime: '2:00 PM',
          endTime: '9:00 PM',
        },
        status: 'scheduled',
        createdBy: 'system',
        createdAt: new Date().toISOString(),
      });
    }
  }
  
  if (stPeteFrontDesk.length > 0) {
    shifts.push({
      id: `shift-stpete-morning-${Date.now()}`,
      location: 'dance-studio',
      assignedStaffId: stPeteFrontDesk[0].id,
      assignedStaffName: stPeteFrontDesk[0].name,
      templateType: 'front-desk',
      notes: 'Morning front desk coverage',
      recurrence: {
        type: 'weekly',
        dayOfWeek: 1, // Monday
        startTime: '6:00 AM',
        endTime: '2:00 PM',
      },
      status: 'scheduled',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    });
    
    shifts.push({
      id: `shift-stpete-morning-fri-${Date.now()}`,
      location: 'dance-studio',
      assignedStaffId: stPeteFrontDesk[0].id,
      assignedStaffName: stPeteFrontDesk[0].name,
      templateType: 'front-desk',
      notes: 'Morning front desk coverage',
      recurrence: {
        type: 'weekly',
        dayOfWeek: 5, // Friday
        startTime: '6:00 AM',
        endTime: '2:00 PM',
      },
      status: 'scheduled',
      createdBy: 'system',
      createdAt: new Date().toISOString(),
    });
  }
  
  const today = new Date();
  const nextSaturday = new Date(today);
  nextSaturday.setDate(today.getDate() + (6 - today.getDay()));
  
  shifts.push({
    id: `shift-event-${Date.now()}`,
    location: 'athletic-club',
    assignedStaffId: undefined,
    assignedStaffName: undefined,
    templateType: 'event',
    notes: 'Open House Event - need staff coverage',
    recurrence: {
      type: 'none',
    },
    date: nextSaturday.toISOString().split('T')[0],
    startTime: '10:00 AM',
    endTime: '2:00 PM',
    status: 'open',
    createdBy: 'system',
    createdAt: new Date().toISOString(),
  });
  
  return shifts;
}

export const coachLeadInteractions = generateCoachLeadInteractions();
export const substitutionRequests = generateSubstitutionRequests();
export const timeOffRequests = generateTimeOffRequests();
export const staffSettings = generateStaffSettings();
export const staffShifts = generateStaffShifts();
