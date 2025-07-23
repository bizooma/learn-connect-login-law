-- First, remove duplicate user_roles entries, keeping only the latest one for each user
DELETE FROM public.user_roles 
WHERE id NOT IN (
    SELECT DISTINCT ON (user_id) id 
    FROM public.user_roles 
    ORDER BY user_id, created_at DESC
);

-- Now add the unique constraint
ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_user_id_unique UNIQUE (user_id);

-- Add missing RLS policy for users to create their own profiles during registration  
CREATE POLICY "Users can create their own profile during registration" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = id);