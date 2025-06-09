
-- Update the user role for free@test.com from 'student' to 'free'
UPDATE user_roles 
SET role = 'free' 
WHERE user_id = (
  SELECT id 
  FROM profiles 
  WHERE email = 'free@test.com'
);
