
DO $$
DECLARE
  cat_id uuid := 'a4b3e3bc-45ce-4a19-90ec-51ec46096686';
  admin_id uuid;
  overview_id uuid;
  doc_id uuid;
  kc_id uuid;
BEGIN
  SELECT user_id INTO admin_id FROM user_roles WHERE role='admin' LIMIT 1;

  INSERT INTO wiki_articles (category_id, title, content, sort_order, is_published, created_by, content_type)
  VALUES (cat_id, 'Overview', '', 1, true, admin_id, 'document') RETURNING id INTO overview_id;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (overview_id, 'Purpose & Target', '', 1, admin_id);

  INSERT INTO wiki_articles (category_id, title, content, sort_order, is_published, created_by, content_type)
  VALUES (cat_id, 'Managing PNC Non-Booking Scenarios in HubSpot', '', 2, true, admin_id, 'document') RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (doc_id, 'Introduction', '', 1, admin_id),
    (doc_id, 'Log into HubSpot', '', 2, admin_id),
    (doc_id, 'Identify the scenario that applies to the PNC', '', 3, admin_id),
    (doc_id, 'Apply the correct communication approach using approved scripts', '', 4, admin_id),
    (doc_id, 'Update the HubSpot deal stage accordingly', '', 5, admin_id),
    (doc_id, 'Document the interaction in HubSpot', '', 6, admin_id),
    (doc_id, 'Create and complete follow-up tasks as required', '', 7, admin_id);

  INSERT INTO wiki_articles (category_id, title, content, sort_order, is_published, created_by, content_type)
  VALUES (cat_id, 'Knowledge Check', '', 3, false, admin_id, 'document') RETURNING id INTO kc_id;
END $$;
