
DO $$
DECLARE
  cat_id uuid;
  creator uuid;
  doc_id uuid;
BEGIN
  SELECT created_by INTO creator FROM wiki_categories WHERE title = 'Reassigning Cases (12)';

  INSERT INTO wiki_categories (title, category, sort_order, is_published, created_by)
  VALUES ('Police Reports (14)', 'procedure', 19, true, creator)
  RETURNING id INTO cat_id;

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Police Report (3.14.1)', 'document', 0, true, creator)
  RETURNING id INTO doc_id;

  INSERT INTO wiki_pages (article_id, title, sort_order, is_published, created_by) VALUES
    (doc_id, 'Introduction', 0, true, creator),
    (doc_id, 'Appropriate Form and Submission', 1, true, creator),
    (doc_id, 'Complete Form', 2, true, creator),
    (doc_id, 'Submit Request', 3, true, creator),
    (doc_id, 'Pay Fees', 4, true, creator),
    (doc_id, 'Follow Client Email Communication Policy', 5, true, creator),
    (doc_id, 'Monitor and Follow Up', 6, true, creator),
    (doc_id, 'Recap', 7, true, creator);
END $$;
