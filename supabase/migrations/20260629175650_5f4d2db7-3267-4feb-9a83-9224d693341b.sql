
DO $$
DECLARE
  cat_id uuid := '3fca9f8d-a8b9-4914-982a-2c0f2d68a55a';
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
  VALUES (cat_id, 'Using the 3CX Phone System', '', 2, true, admin_id, 'document') RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (doc_id, 'Introduction', '', 1, admin_id),
    (doc_id, 'Log into the 3CX phone system', '', 2, admin_id),
    (doc_id, 'Set the correct call status', '', 3, admin_id),
    (doc_id, 'Handle inbound, outbound, or follow-up calls as required', '', 4, admin_id),
    (doc_id, 'Document call details in HubSpot', '', 5, admin_id),
    (doc_id, 'Log voicemails in HubSpot', '', 6, admin_id);

  INSERT INTO wiki_articles (category_id, title, content, sort_order, is_published, created_by, content_type)
  VALUES (cat_id, 'Knowledge Check', '', 3, false, admin_id, 'document') RETURNING id INTO kc_id;
END $$;
