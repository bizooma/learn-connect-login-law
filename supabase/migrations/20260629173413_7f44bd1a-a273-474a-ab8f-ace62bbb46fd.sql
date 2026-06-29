
DO $$
DECLARE
  cat_id uuid := '0d691a44-b547-422a-a9ca-34fe5f072b5e';
  uid uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  doc_id uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Overview', 'document', 0, true, uid) RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES (doc_id, 'Purpose & Target', 0, uid);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Entering Conflict Contact Information (3.18.1)', 'document', 1, true, uid) RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (doc_id, 'Introduction', 0, uid),(doc_id, 'Intro Review', 1, uid),(doc_id, 'Search in Filevine', 2, uid),
    (doc_id, 'Documenting in Filevine', 3, uid),(doc_id, 'Documenting in Excel', 4, uid),
    (doc_id, 'Weekly Case Log Update', 5, uid),(doc_id, 'Final Check', 6, uid),(doc_id, 'Auditing and Review', 7, uid);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Standard Operating Procedure for Conducting Conflict of Interest at Intake (3.18.2)', 'document', 2, true, uid) RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (doc_id, 'Introduction', 0, uid),(doc_id, 'Gather Information', 1, uid),(doc_id, 'Identify Conflicts', 2, uid),
    (doc_id, 'Assess Conflicts', 3, uid),(doc_id, 'Resolve Conflicts', 4, uid),(doc_id, 'Document', 5, uid),(doc_id, 'Conclusion', 6, uid);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Subject Recap', 'document', 3, true, uid) RETURNING id INTO doc_id;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES (doc_id, 'Target', 0, uid);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Knowledge Check', 'quiz', 4, true, uid);
END $$;
