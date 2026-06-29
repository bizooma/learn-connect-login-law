
DO $$
DECLARE
  cat_id uuid := '0594c0ac-7068-4ed9-9247-a343972154e3';
  uid uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  overview_id uuid; main_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Overview', 'procedure', 1, uid) RETURNING id INTO overview_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES (overview_id, 'Purpose & Target', 1, uid);

  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Identify and Respond to Client Red Flags', 'procedure', 2, uid) RETURNING id INTO main_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (main_id, 'Familiarize with red flags list', 1, uid),
    (main_id, 'Identify red flags during file review or client conversations', 2, uid),
    (main_id, 'Document and escalate appropriately', 3, uid),
    (main_id, 'Coordinate strategy for addressing red flags', 4, uid);

  INSERT INTO wiki_articles (category_id, title, subject_category, sort_order, created_by)
  VALUES (cat_id, 'Knowledge Check', 'procedure', 3, uid);
END $$;
