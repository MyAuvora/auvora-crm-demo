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

-- =====================================================
-- CONTRACTS & AGREEMENTS
-- =====================================================

-- Create tenant_contracts table for storing contract/agreement files
CREATE TABLE IF NOT EXISTS tenant_contracts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  file_url TEXT,
  file_type TEXT,
  file_size INTEGER,
  notes TEXT,
  signed_date DATE,
  expiry_date DATE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'signed', 'expired', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tenant_contracts
ALTER TABLE tenant_contracts ENABLE ROW LEVEL SECURITY;

-- Auvora admins can manage all contracts
CREATE POLICY "Auvora admins can manage contracts" ON tenant_contracts
  FOR ALL USING (is_auvora_admin());

-- Tenant owners can view their contracts
CREATE POLICY "Owners can view their contracts" ON tenant_contracts
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );

-- Create trigger for tenant_contracts updated_at
CREATE TRIGGER update_tenant_contracts_updated_at 
  BEFORE UPDATE ON tenant_contracts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create index on contracts
CREATE INDEX IF NOT EXISTS idx_tenant_contracts_tenant_id ON tenant_contracts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_contracts_status ON tenant_contracts(status);

-- =====================================================
-- PAYMENT & BILLING INFO
-- =====================================================

-- Add subscription and billing fields to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'starter' 
  CHECK (subscription_plan IN ('starter', 'professional', 'enterprise', 'custom'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS billing_cycle TEXT DEFAULT 'monthly' 
  CHECK (billing_cycle IN ('monthly', 'quarterly', 'annual'));
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2);
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS next_billing_date DATE;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS payment_method_last4 TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Create tenant_invoices table for invoice history
CREATE TABLE IF NOT EXISTS tenant_invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_number TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded', 'cancelled')),
  due_date DATE NOT NULL,
  paid_date DATE,
  payment_method TEXT,
  stripe_invoice_id TEXT,
  stripe_payment_intent_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on tenant_invoices
ALTER TABLE tenant_invoices ENABLE ROW LEVEL SECURITY;

-- Auvora admins can manage all invoices
CREATE POLICY "Auvora admins can manage invoices" ON tenant_invoices
  FOR ALL USING (is_auvora_admin());

-- Tenant owners can view their invoices
CREATE POLICY "Owners can view their invoices" ON tenant_invoices
  FOR SELECT USING (
    tenant_id IN (SELECT tenant_id FROM users WHERE id = auth.uid() AND role = 'owner')
  );

-- Create trigger for tenant_invoices updated_at
CREATE TRIGGER update_tenant_invoices_updated_at 
  BEFORE UPDATE ON tenant_invoices 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes on invoices
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_tenant_id ON tenant_invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_status ON tenant_invoices(status);
CREATE INDEX IF NOT EXISTS idx_tenant_invoices_due_date ON tenant_invoices(due_date);

-- =====================================================
-- DEMO TENANT MANAGEMENT
-- =====================================================

-- Add demo-related fields to tenants table
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS is_demo BOOLEAN DEFAULT false;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS demo_industry TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ;

-- Create index on demo tenants for faster queries
CREATE INDEX IF NOT EXISTS idx_tenants_is_demo ON tenants(is_demo) WHERE is_demo = true;

-- Allow Auvora admins to manage all staff (for demo data seeding)
CREATE POLICY IF NOT EXISTS "Auvora admins can manage all staff" ON staff
  FOR ALL USING (is_auvora_admin());

-- Allow Auvora admins to manage all members (for demo data seeding)
CREATE POLICY IF NOT EXISTS "Auvora admins can manage all members" ON members
  FOR ALL USING (is_auvora_admin());

-- Allow Auvora admins to manage all classes (for demo data seeding)
CREATE POLICY IF NOT EXISTS "Auvora admins can manage all classes" ON classes
  FOR ALL USING (is_auvora_admin());

-- Allow Auvora admins to manage all leads (for demo data seeding)
CREATE POLICY IF NOT EXISTS "Auvora admins can manage all leads" ON leads
  FOR ALL USING (is_auvora_admin());

-- Allow Auvora admins to manage all bookings (for demo data cleanup)
CREATE POLICY IF NOT EXISTS "Auvora admins can manage all bookings" ON bookings
  FOR ALL USING (is_auvora_admin());

-- Allow Auvora admins to manage all transactions (for demo data cleanup)
CREATE POLICY IF NOT EXISTS "Auvora admins can manage all transactions" ON transactions
  FOR ALL USING (is_auvora_admin());
