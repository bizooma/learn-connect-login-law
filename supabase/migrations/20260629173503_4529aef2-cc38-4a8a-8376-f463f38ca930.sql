
DO $$
DECLARE
  cat_id uuid := '11acc367-83e8-4ac5-8e6d-c3d93d30893a';
  uid uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  doc_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Daily Mail Scanning Procedure (3.19.1)', 'document', 0, true, uid) RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (doc_id, 'Introduction', 0, uid),
    (doc_id, 'Scan and Upload Document', 1, uid),
    (doc_id, 'Daily Mail Table', 2, uid),
    (doc_id, 'Create Subfolder', 3, uid),
    (doc_id, 'Recap', 4, uid);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Knowledge Check', 'quiz', 1, true, uid);
END $$;
