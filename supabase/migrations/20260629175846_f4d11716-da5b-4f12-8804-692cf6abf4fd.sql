
DO $$
DECLARE
  cat_id uuid := '6bf8dfad-bbfa-45ea-9c4b-be1186c2bf1b';
  creator uuid;
  overview_id uuid;
  main_id uuid;
  kc_id uuid;
BEGIN
  SELECT created_by INTO creator FROM wiki_categories WHERE id = cat_id;

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Overview', 'procedure', 'This SOP outlines how Dragons should manage Strategy Session rescheduling and cancellation requests. It ensures consistent handling, clear communication, proper documentation in HubSpot, and correct escalation to supervisors or the Sales Manager when needed.', creator, 1)
  RETURNING id INTO overview_id;

  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (overview_id, 'Purpose & Target', '', 1, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Handling Strategy Session Rescheduling and Cancellations', 'procedure', '', creator, 2)
  RETURNING id INTO main_id;

  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (main_id, 'Introduction', '', 1, creator),
    (main_id, 'Identify which scenario applies (1, 2, or 3)', '', 2, creator),
    (main_id, 'Take action according to scenario policy', '', 3, creator),
    (main_id, 'Document in HubSpot using approved format', '', 4, creator),
    (main_id, 'Escalate to Yarianni or supervisor when required', '', 5, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Knowledge Check', 'procedure', '', creator, 3)
  RETURNING id INTO kc_id;
END $$;
