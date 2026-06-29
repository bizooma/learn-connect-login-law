
DO $$
DECLARE
  cat_id uuid := 'caf46887-ef2f-4c8a-ad64-42fc9805998c';
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
  VALUES (cat_id, 'Managing Contacts, Deals, and Activity Logging in HubSpot', '', 2, true, admin_id, 'document') RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (doc_id, 'Introduction', '', 1, admin_id),
    (doc_id, 'Creating a Contact', '', 2, admin_id),
    (doc_id, 'Creating a Deal', '', 3, admin_id),
    (doc_id, 'Intake Completion', '', 4, admin_id),
    (doc_id, 'Deal Stage Updates', '', 5, admin_id),
    (doc_id, 'Logging Calls, Messages, and Notes', '', 6, admin_id),
    (doc_id, 'Best Practices & Mistakes to Avoid', '', 7, admin_id);

  INSERT INTO wiki_articles (category_id, title, content, sort_order, is_published, created_by, content_type)
  VALUES (cat_id, 'Knowledge Check', '', 3, false, admin_id, 'document') RETURNING id INTO kc_id;
END $$;
