-- Clean up duplicate sort_order units in Declarations lesson and mark intended deletions as drafts
UPDATE units 
SET is_draft = true 
WHERE id IN (
  'f62bba48-44b0-4a1f-a994-97b5248a221d', -- Claude Prompts During the Interview
  '8cd9b238-f93b-4f2d-8302-88cdbb42a7bf', -- Using Claude AI to Draft Cover Letters  
  'b52b45fd-a704-444c-ba47-584bf2ccbf97'  -- Claude Prompts, Prepare for the Declaration
);