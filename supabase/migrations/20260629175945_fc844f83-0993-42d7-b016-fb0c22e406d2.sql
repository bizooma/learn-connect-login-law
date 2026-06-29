
DO $$
DECLARE
  cat_id uuid := '75668351-d600-4dd1-a36e-60ae2f3d9fe3';
  creator uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  overview_id uuid;
  main_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Overview', 'procedure', 'This SOP ensures all Calendly bookings for Strategy Sessions and Priming Calls are accurate, correctly synced, and fully documented. It prevents scheduling errors, double-bookings, and communication gaps by standardizing how Dragons schedule, confirm, and document all appointments in HubSpot, Teams, and Outlook.', creator, 1)
  RETURNING id INTO overview_id;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (overview_id, 'Purpose & Target', '', 1, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Maintaining Calendly Accuracy & Avoid Common Errors', 'procedure', '', creator, 2)
  RETURNING id INTO main_id;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (main_id, 'Introduction', '', 1, creator),
    (main_id, 'Open the Correct Calendly Link', '', 2, creator),
    (main_id, 'Select Strategist and Location', '', 3, creator),
    (main_id, 'Complete Calendly Form', '', 4, creator),
    (main_id, 'Submit and Confirm', '', 5, creator),
    (main_id, 'Update HubSpot and add note', '', 6, creator),
    (main_id, 'Post in Teams', '', 7, creator),
    (main_id, 'Confirm with PNC', '', 8, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Knowledge Check', 'procedure', '', creator, 3);
END $$;
