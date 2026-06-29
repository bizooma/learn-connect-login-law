
DO $$
DECLARE
  cat_id uuid := '67010dd8-f09c-4906-bb08-3a6160b465f6';
  creator uuid;
  doc_id uuid;
  quiz_id uuid;
BEGIN
  SELECT created_by INTO creator FROM wiki_categories WHERE id = cat_id;

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Reassigning Cases (3.12.1)', 'document', 0, true, creator)
  RETURNING id INTO doc_id;

  INSERT INTO wiki_pages (article_id, title, sort_order, is_published, created_by) VALUES
    (doc_id, 'Introduction', 0, true, creator),
    (doc_id, 'Case Reassignment', 1, true, creator),
    (doc_id, 'Review Upcoming Appointments', 2, true, creator),
    (doc_id, 'Submit Case Reassignment Ticket', 3, true, creator),
    (doc_id, 'Check Tickets', 4, true, creator),
    (doc_id, 'Update Team', 5, true, creator),
    (doc_id, 'Check Attorney and Paralegal Names on Project', 6, true, creator),
    (doc_id, 'Update Case Summary Names', 7, true, creator),
    (doc_id, 'Update Hashtags', 8, true, creator),
    (doc_id, 'Check and Reassign Incomplete Tasks', 9, true, creator),
    (doc_id, 'Confirm Completion', 10, true, creator),
    (doc_id, 'Recap', 11, true, creator);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Knowledge Check', 'quiz', 1, true, creator)
  RETURNING id INTO quiz_id;
END $$;
