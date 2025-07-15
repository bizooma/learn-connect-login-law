-- Fix the specific problematic unit that won't delete from Sales Training-200
UPDATE units 
SET is_draft = true, updated_at = now()
WHERE id = 'bf2b21b9-06fe-4980-828f-e2aa4dd0fa80'
  AND title = 'Screening for and Selling U Visas';