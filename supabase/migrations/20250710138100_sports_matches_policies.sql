-- Enable RLS and add policies for sports_matches
ALTER TABLE public.sports_matches ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read matches
CREATE POLICY sports_matches_read
ON public.sports_matches
FOR SELECT
TO authenticated
USING (true);

-- Helper function to check admin from profiles
CREATE OR REPLACE FUNCTION public.is_admin_user(uid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
AS $$
  SELECT COALESCE((SELECT is_admin FROM public.profiles p WHERE p.id = uid), false);
$$;

-- Allow insert by admins only
CREATE POLICY sports_matches_insert_admin
ON public.sports_matches
FOR INSERT
TO authenticated
WITH CHECK (public.is_admin_user(auth.uid()));

-- Allow update by admins only
CREATE POLICY sports_matches_update_admin
ON public.sports_matches
FOR UPDATE
TO authenticated
USING (public.is_admin_user(auth.uid()))
WITH CHECK (public.is_admin_user(auth.uid()));
