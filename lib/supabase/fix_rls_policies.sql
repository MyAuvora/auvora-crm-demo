-- Fix RLS Policy Recursion Issue
-- Run this in Supabase SQL Editor to fix the infinite recursion error

-- First, drop the existing problematic policies
DROP POLICY IF EXISTS "Users can view their own tenant" ON tenants;
DROP POLICY IF EXISTS "Users can view users in their tenant" ON users;
DROP POLICY IF EXISTS "Owners can manage users in their tenant" ON users;
DROP POLICY IF EXISTS "Users can view members in their tenant" ON members;
DROP POLICY IF EXISTS "Users can manage members in their tenant" ON members;
DROP POLICY IF EXISTS "Users can view leads in their tenant" ON leads;
DROP POLICY IF EXISTS "Users can manage leads in their tenant" ON leads;
DROP POLICY IF EXISTS "Users can view staff in their tenant" ON staff;
DROP POLICY IF EXISTS "Managers can manage staff in their tenant" ON staff;
DROP POLICY IF EXISTS "Users can view classes in their tenant" ON classes;
DROP POLICY IF EXISTS "Managers can manage classes in their tenant" ON classes;
DROP POLICY IF EXISTS "Users can view bookings in their tenant" ON bookings;
DROP POLICY IF EXISTS "Users can manage bookings in their tenant" ON bookings;
DROP POLICY IF EXISTS "Users can view transactions in their tenant" ON transactions;
DROP POLICY IF EXISTS "Managers can manage transactions in their tenant" ON transactions;

-- Create a security definer function to get user's tenant_id without RLS recursion
CREATE OR REPLACE FUNCTION get_user_tenant_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT tenant_id FROM public.users WHERE id = auth.uid()
$$;

-- Create a security definer function to get user's role without RLS recursion
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT role FROM public.users WHERE id = auth.uid()
$$;

-- RLS Policies for users table (special case - users can always see their own record)
CREATE POLICY "Users can view their own record" ON users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Users can view users in their tenant" ON users
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Owners can insert users in their tenant" ON users
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id() AND get_user_role() = 'owner'
  );

CREATE POLICY "Owners can update users in their tenant" ON users
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id() AND get_user_role() = 'owner'
  );

CREATE POLICY "Owners can delete users in their tenant" ON users
  FOR DELETE USING (
    tenant_id = get_user_tenant_id() AND get_user_role() = 'owner'
  );

-- RLS Policies for tenants
CREATE POLICY "Users can view their own tenant" ON tenants
  FOR SELECT USING (id = get_user_tenant_id());

-- RLS Policies for members
CREATE POLICY "Users can view members in their tenant" ON members
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert members in their tenant" ON members
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update members in their tenant" ON members
  FOR UPDATE USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete members in their tenant" ON members
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- RLS Policies for leads
CREATE POLICY "Users can view leads in their tenant" ON leads
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert leads in their tenant" ON leads
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update leads in their tenant" ON leads
  FOR UPDATE USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete leads in their tenant" ON leads
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- RLS Policies for staff
CREATE POLICY "Users can view staff in their tenant" ON staff
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Managers can insert staff in their tenant" ON staff
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "Managers can update staff in their tenant" ON staff
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "Managers can delete staff in their tenant" ON staff
  FOR DELETE USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager')
  );

-- RLS Policies for classes
CREATE POLICY "Users can view classes in their tenant" ON classes
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Managers can insert classes in their tenant" ON classes
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager', 'head-coach')
  );

CREATE POLICY "Managers can update classes in their tenant" ON classes
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager', 'head-coach')
  );

CREATE POLICY "Managers can delete classes in their tenant" ON classes
  FOR DELETE USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager', 'head-coach')
  );

-- RLS Policies for bookings
CREATE POLICY "Users can view bookings in their tenant" ON bookings
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can insert bookings in their tenant" ON bookings
  FOR INSERT WITH CHECK (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can update bookings in their tenant" ON bookings
  FOR UPDATE USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Users can delete bookings in their tenant" ON bookings
  FOR DELETE USING (tenant_id = get_user_tenant_id());

-- RLS Policies for transactions
CREATE POLICY "Users can view transactions in their tenant" ON transactions
  FOR SELECT USING (tenant_id = get_user_tenant_id());

CREATE POLICY "Managers can insert transactions in their tenant" ON transactions
  FOR INSERT WITH CHECK (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "Managers can update transactions in their tenant" ON transactions
  FOR UPDATE USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager')
  );

CREATE POLICY "Managers can delete transactions in their tenant" ON transactions
  FOR DELETE USING (
    tenant_id = get_user_tenant_id() AND get_user_role() IN ('owner', 'manager')
  );

-- Allow service role to bypass RLS for initial tenant/user creation during signup
-- This is handled automatically by Supabase when using service_role key

-- Grant execute permissions on the helper functions
GRANT EXECUTE ON FUNCTION get_user_tenant_id() TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_role() TO authenticated;
