-- Signup Trigger: Automatically create tenant and user records when a new auth user signs up
-- Run this in Supabase SQL Editor

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION handle_new_user_signup()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_tenant_id UUID;
  business_name TEXT;
  full_name TEXT;
  subdomain TEXT;
BEGIN
  -- Get metadata from the auth user
  business_name := NEW.raw_user_meta_data->>'business_name';
  full_name := NEW.raw_user_meta_data->>'full_name';
  
  -- Generate a subdomain from the business name (lowercase, replace spaces with hyphens)
  subdomain := lower(regexp_replace(COALESCE(business_name, 'gym'), '[^a-zA-Z0-9]', '-', 'g'));
  -- Add a random suffix to ensure uniqueness
  subdomain := subdomain || '-' || substr(md5(random()::text), 1, 6);
  
  -- Create a new tenant for this business
  INSERT INTO public.tenants (name, subdomain)
  VALUES (COALESCE(business_name, 'My Gym'), subdomain)
  RETURNING id INTO new_tenant_id;
  
  -- Create the user record linked to the tenant
  INSERT INTO public.users (id, tenant_id, email, full_name, role)
  VALUES (
    NEW.id,
    new_tenant_id,
    NEW.email,
    COALESCE(full_name, 'Owner'),
    'owner'
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger to run after a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user_signup();

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
