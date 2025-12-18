-- Admin Portal Schema Updates
-- Run this in Supabase SQL Editor to add admin functionality

-- Add custom_domain to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- Add onboarding_status to track white-glove setup progress
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS onboarding_status TEXT DEFAULT 'pending' 
  CHECK (onboarding_status IN ('pending', 'provisioned', 'branded', 'imported', 'testing', 'ready', 'live'));

-- Add business details for white-glove setup
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_address TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS business_phone TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'America/New_York';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_email TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS owner_name TEXT;

-- Create auvora_admins table for internal Auvora staff
CREATE TABLE IF NOT EXISTS auvora_admins (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'superadmin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on auvora_admins
ALTER TABLE auvora_admins ENABLE ROW LEVEL SECURITY;

-- Only auvora_admins can view the admin table
CREATE POLICY "Admins can view admin table" ON auvora_admins
  FOR SELECT USING (
    auth.uid() IN (SELECT id FROM auvora_admins)
  );

-- Create function to check if user is an Auvora admin
CREATE OR REPLACE FUNCTION is_auvora_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (SELECT 1 FROM auvora_admins WHERE id = auth.uid());
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow Auvora admins to view all tenants
CREATE POLICY "Auvora admins can view all tenants" ON tenants
  FOR SELECT USING (is_auvora_admin());

-- Allow Auvora admins to manage all tenants
CREATE POLICY "Auvora admins can manage all tenants" ON tenants
  FOR ALL USING (is_auvora_admin());

-- Allow Auvora admins to view all users
CREATE POLICY "Auvora admins can view all users" ON users
  FOR SELECT USING (is_auvora_admin());

-- Allow Auvora admins to manage all users
CREATE POLICY "Auvora admins can manage all users" ON users
  FOR ALL USING (is_auvora_admin());

-- Create import_jobs table to track data migrations
CREATE TABLE IF NOT EXISTS import_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  source_crm TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  total_records INTEGER DEFAULT 0,
  imported_records INTEGER DEFAULT 0,
  failed_records INTEGER DEFAULT 0,
  error_log JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on import_jobs
ALTER TABLE import_jobs ENABLE ROW LEVEL SECURITY;

-- Auvora admins can manage import jobs
CREATE POLICY "Auvora admins can manage import jobs" ON import_jobs
  FOR ALL USING (is_auvora_admin());

-- Tenant owners can view their import jobs
CREATE POLICY "Owners can view their import jobs" ON import_jobs
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );

-- Create trigger for import_jobs updated_at
CREATE TRIGGER update_import_jobs_updated_at 
  BEFORE UPDATE ON import_jobs 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create trigger for auvora_admins updated_at
CREATE TRIGGER update_auvora_admins_updated_at 
  BEFORE UPDATE ON auvora_admins 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create auvora_leads table for demo form submissions and lead tracking
CREATE TABLE IF NOT EXISTS auvora_leads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  business_name TEXT,
  industry TEXT CHECK (industry IN ('fitness', 'education', 'wellness', 'beauty', 'auxiliary')),
  sub_category TEXT,
  source TEXT DEFAULT 'demo_form',
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'converted', 'lost')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on auvora_leads
ALTER TABLE auvora_leads ENABLE ROW LEVEL SECURITY;

-- Auvora admins can manage all leads
CREATE POLICY "Auvora admins can manage leads" ON auvora_leads
  FOR ALL USING (is_auvora_admin());

-- Allow public to insert leads (for demo form submissions)
CREATE POLICY "Public can submit leads" ON auvora_leads
  FOR INSERT WITH CHECK (true);

-- Create trigger for auvora_leads updated_at
CREATE TRIGGER update_auvora_leads_updated_at 
  BEFORE UPDATE ON auvora_leads 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index on leads for faster queries
CREATE INDEX IF NOT EXISTS idx_auvora_leads_status ON auvora_leads(status);
CREATE INDEX IF NOT EXISTS idx_auvora_leads_industry ON auvora_leads(industry);
CREATE INDEX IF NOT EXISTS idx_auvora_leads_created_at ON auvora_leads(created_at DESC);
