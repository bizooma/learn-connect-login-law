-- Delete the problematic unit causing duplicate key constraint errors
DELETE FROM units 
WHERE id = 'bf2b21b9-06fe-4980-828f-e2aa4dd0fa80' 
  AND title = 'Screening for and Selling U Visas';