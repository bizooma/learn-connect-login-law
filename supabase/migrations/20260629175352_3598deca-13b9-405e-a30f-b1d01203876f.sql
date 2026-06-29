
DO $$
DECLARE
  cat_id uuid := '58b6f964-8813-40d4-9c12-f1586790dbd5';
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
  VALUES (cat_id, 'Conducting Structured Follow-Up in HubSpot', '', 2, true, admin_id, 'document') RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (doc_id, 'Introduction', '', 1, admin_id),
    (doc_id, 'Log into HubSpot', '', 2, admin_id),
    (doc_id, 'Review assigned PNC contacts and pending tasks', '', 3, admin_id),
    (doc_id, 'Execute follow-up actions (call, text, email) according to the timeline', '', 4, admin_id),
    (doc_id, 'Document all follow-ups in HubSpot (Call, Note, or Task)', '', 5, admin_id),
    (doc_id, 'Create and complete tasks for each promised follow-up', '', 6, admin_id),
    (doc_id, 'Adjust contact frequency for unresponsive PNCs after 90 days', '', 7, admin_id);

  INSERT INTO wiki_articles (category_id, title, content, sort_order, is_published, created_by, content_type)
  VALUES (cat_id, 'Knowledge Check', '', 3, false, admin_id, 'document') RETURNING id INTO kc_id;
END $$;
