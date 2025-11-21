# Auvora CRM Demo - The LAB Tampa

A front-end only demo web app for a gym/dance studio CRM with an AI assistant called Auvora. Built for The LAB Tampa, featuring comprehensive management tools for both an Athletic Club (gym) and Dance Studio.

## Features

### Multi-Location Support
- **Athletic Club**: Full gym management with memberships and class packs
- **Dance Studio**: Dance class management with class pack system
- Easy location toggle in the navigation bar

### Dashboard
- Real-time metrics: check-ins, classes, new leads, active members
- Monthly performance tracking (new joins vs cancellations)
- AI-powered insights and recommendations

### Leads & Members Management
- **Leads**: Track potential customers with status (Cancelled, Trial-No-Join, New Lead)
- **Members**: Manage active members with membership types or class packs
- Advanced filtering by status, source, membership type, and zip code
- Detailed member/lead profiles with complete information

### Schedule & Classes
- Weekly class schedule view
- Athletic Club: 30 and 60-minute sessions (7 classes/day Mon-Fri, 2 on Sat)
- Dance Studio: 60-minute classes (Zumba, Salsa, Hip-Hop - 3 classes/day Mon-Fri)
- Class capacity tracking and booking management

### Coaches & Staff
- Staff directory with roles (Coach, Front Desk, Instructor)
- Performance metrics: classes per week, average class size
- Specialties and dance styles tracking

### POS & Inventory
- Point of Sale system for retail items and memberships
- Product catalog with stock management
- Low stock alerts
- Support for guest purchases and member accounts

### Promotions
- Campaign management with status tracking (Planned, Active, Ended)
- Performance metrics: signups and revenue
- POS integration for promotional items

### Reports & Analytics
- Membership distribution charts
- Class pack analysis
- Lead source breakdown (pie chart)
- Top 10 zip codes visualization
- Cancellation tracking

### Ask Auvora AI Assistant
- Floating chat widget available on all screens
- 25+ pre-configured example prompts
- Intelligent responses based on actual seed data
- Queries about members, leads, classes, staff, and business metrics

## Tech Stack

- **Framework**: Next.js 16 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns

## Seed Data

The application includes comprehensive realistic seed data:

### Athletic Club
- 150 active members (split across 1x/week, 2x/week, unlimited memberships)
- 50 class pack clients (5-pack, 10-pack, 20-pack)
- 100 leads (various statuses and sources)
- 5-7 coaches with specialties
- 3 front desk employees
- Full weekly schedule (Mon-Fri: 7 classes/day, Sat: 2 classes)

### Dance Studio
- 50 class pack clients (5-pack, 10-pack, 20-pack)
- 3-7 dance instructors (Zumba, Salsa, Hip-Hop)
- Full weekly schedule (Mon-Fri: 3 classes/day)

All data uses Tampa Bay area zip codes (33602, 33603, 33606, 33607, 33609, 33611, etc.)

## Installation

```bash
# Clone the repository
git clone https://github.com/MyAuvora/auvora-crm-demo.git

# Navigate to the project directory
cd auvora-crm-demo

# Install dependencies
npm install

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Build for Production

```bash
# Build the application
npm run build

# Start the production server
npm start
```

## Project Structure

```
auvora-crm-demo/
├── app/                    # Next.js app directory
│   ├── layout.tsx         # Root layout with AppProvider
│   ├── page.tsx           # Main CRM application
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── Dashboard.tsx      # Dashboard with metrics
│   ├── LeadsMembers.tsx   # Leads and members management
│   ├── Schedule.tsx       # Class schedule view
│   ├── StaffSection.tsx   # Staff management
│   ├── POS.tsx           # Point of sale and inventory
│   ├── Reports.tsx        # Analytics and reports
│   ├── Promotions.tsx     # Promotional campaigns
│   └── AuvoraChat.tsx     # AI assistant chat widget
├── data/                  # Seed data
│   └── seedData.ts        # Generated realistic data
├── lib/                   # Utilities
│   ├── types.ts          # TypeScript type definitions
│   └── context.tsx        # React context for app state
└── public/               # Static assets
    └── thelab-logo.png   # The LAB Tampa logo
```

## Branding

The application uses The LAB Tampa's official branding:
- **Logo**: White logo on dark backgrounds
- **Primary Color**: Red (#AC1305 / rgb(172, 19, 5))
- **Background**: Black header with white content areas
- **Typography**: Clean, modern sans-serif fonts

## User Roles

The demo is configured for an **Owner/Manager** role with full access to all features. The UI displays the current role in the header.

## Responsive Design

The application is fully responsive and works on:
- Desktop browsers (1024px+)
- Tablets (768px - 1023px)
- Mobile devices (320px - 767px)

Mobile features include:
- Collapsible navigation menu
- Touch-friendly interface
- Optimized layouts for small screens

## Ask Auvora Examples

The AI assistant can answer questions like:
- "Generate a list of all current members."
- "Show me all membership cancellations from the past 30 days."
- "Which zip codes do our current members live in?"
- "How many active members does the Athletic Club have?"
- "Which coaches have the highest average class size?"
- "Give me a quick summary of business health for this month."

And 20+ more pre-configured prompts!

## Development Notes

This is a **front-end only demo** with in-memory data. All data is stored in `data/seedData.ts` and resets on page refresh. For a production version, you would need to:
- Implement a backend API
- Add database integration
- Implement real authentication
- Add real payment processing
- Integrate with actual AI services

## License

This is a demo application built for The LAB Tampa.

## Contact

For questions or feedback, please contact Patrick Metzger (myauvora@gmail.com).
