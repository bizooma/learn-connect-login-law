-- Fix seat count inconsistency by updating used_seats to match actual employee count
UPDATE law_firms 
SET used_seats = (
  SELECT COUNT(*) 
  FROM profiles 
  WHERE profiles.law_firm_id = law_firms.id 
    AND profiles.is_deleted = false
)
WHERE EXISTS (
  SELECT 1 
  FROM profiles 
  WHERE profiles.law_firm_id = law_firms.id 
    AND profiles.is_deleted = false
);

-- Create a function to recalculate seat counts for all law firms
CREATE OR REPLACE FUNCTION public.recalculate_law_firm_seat_counts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE law_firms 
  SET used_seats = (
    SELECT COUNT(*) 
    FROM profiles 
    WHERE profiles.law_firm_id = law_firms.id 
      AND profiles.is_deleted = false
  );
END;
$$;