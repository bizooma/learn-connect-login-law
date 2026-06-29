
DO $$
DECLARE
  cat_id uuid := '5f0f5852-d6fe-42e9-9514-2aeb397a569d';
  creator uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  ov uuid; mn uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Overview', 'procedure', 'This SOP outlines the complete Good News Journey — the process of transforming document delivery into a meaningful client celebration. It details how Legal, Engagement, Office Management, Marketing, HR, and Client Happiness teams collaborate to celebrate milestones, capture testimonials, manage logistics, and uphold New Frontier''s mission-driven client experience.', creator, 1)
  RETURNING id INTO ov;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (ov, 'Purpose & Overview', '', 1, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Good News Journey – Master', 'procedure', '', creator, 2)
  RETURNING id INTO mn;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (mn, 'Introduction', '', 1, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order) VALUES
    (cat_id, 'Legal Assistant Role in Good News', 'procedure', '', creator, 3),
    (cat_id, 'Engagement Coordinator Role in Good News', 'procedure', '', creator, 4),
    (cat_id, 'Office Manager Role in Good News', 'procedure', '', creator, 5),
    (cat_id, 'Marketing Team Role in Good News', 'procedure', '', creator, 6),
    (cat_id, 'Host Role in Good News', 'procedure', '', creator, 7),
    (cat_id, 'HR Role in Good News', 'procedure', '', creator, 8),
    (cat_id, 'Client Happiness Coordinator Role in Good News', 'procedure', '', creator, 9);
END $$;
