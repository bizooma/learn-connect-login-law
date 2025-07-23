-- Fix user_roles table constraint for upserts
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Add missing RLS policy for users to create their own profiles during registration  
CREATE POLICY "Users can create their own profile during registration" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);