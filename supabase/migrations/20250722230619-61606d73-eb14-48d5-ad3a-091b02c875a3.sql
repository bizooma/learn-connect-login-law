-- Update john@smith.com from student role to free role
UPDATE public.user_roles 
SET role = 'free' 
WHERE user_id = (
  SELECT id FROM auth.users 
  WHERE email = 'john@smith.com'
);