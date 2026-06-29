
DO $$
DECLARE
  cat_id uuid;
  creator uuid;
  doc_id uuid;
BEGIN
  SELECT created_by INTO creator FROM wiki_categories WHERE title = 'Reassigning Cases (12)';

  INSERT INTO wiki_categories (title, category, sort_order, is_published, created_by)
  VALUES ('Submitting FOIA Requests (13)', 'procedure', 18, true, creator)
  RETURNING id INTO cat_id;

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Process for Requesting FOIA (3.13.1)', 'document', 0, true, creator)
  RETURNING id INTO doc_id;

  INSERT INTO wiki_pages (article_id, title, sort_order, is_published, created_by) VALUES
    (doc_id, 'Introduction', 0, true, creator),
    (doc_id, 'Determine the Need for FOIA Requests', 1, true, creator),
    (doc_id, 'Collect Client Information', 2, true, creator),
    (doc_id, 'Prepare Packet for Signatures', 3, true, creator),
    (doc_id, 'Review Signed Forms', 4, true, creator),
    (doc_id, 'Submit FOIA Requests', 5, true, creator),
    (doc_id, 'Update in Filevine', 6, true, creator),
    (doc_id, 'Track Agency Responses', 7, true, creator),
    (doc_id, 'Recap', 8, true, creator);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Knowledge Check', 'quiz', 1, true, creator);
END $$;
