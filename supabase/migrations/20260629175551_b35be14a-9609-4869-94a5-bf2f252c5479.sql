
DO $$
DECLARE
  cat_id uuid := '25eaad3c-4c4e-4617-9fcf-0521efa1cbbd';
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
  VALUES (cat_id, 'Processing Strategy Session Payments Using HubSpot and In-Office Methods', '', 2, true, admin_id, 'document') RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (doc_id, 'Introduction', '', 1, admin_id),
    (doc_id, 'Log into HubSpot', '', 2, admin_id),
    (doc_id, 'Locate the correct payment link', '', 3, admin_id),
    (doc_id, 'Send the payment link OR collect payment directly', '', 4, admin_id),
    (doc_id, 'Process the payment', '', 5, admin_id),
    (doc_id, 'Document the payment in HubSpot and Teams', '', 6, admin_id),
    (doc_id, 'Troubleshoot if payment errors occur', '', 7, admin_id),
    (doc_id, 'Follow the in-office payment process if applicable', '', 8, admin_id);

  INSERT INTO wiki_articles (category_id, title, content, sort_order, is_published, created_by, content_type)
  VALUES (cat_id, 'Knowledge Check', '', 3, false, admin_id, 'document') RETURNING id INTO kc_id;
END $$;
