
-- Make course fields optional (except title which remains required)
ALTER TABLE courses 
ALTER COLUMN instructor DROP NOT NULL,
ALTER COLUMN duration DROP NOT NULL,
ALTER COLUMN level DROP NOT NULL,
ALTER COLUMN category DROP NOT NULL;

-- Set default values for better UX
ALTER TABLE courses 
ALTER COLUMN instructor SET DEFAULT '',
ALTER COLUMN duration SET DEFAULT '',
ALTER COLUMN level SET DEFAULT '',
ALTER COLUMN category SET DEFAULT '';
