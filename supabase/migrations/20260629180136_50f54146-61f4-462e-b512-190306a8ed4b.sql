
DO $$
DECLARE
  cat_id uuid := '4e18a6a6-6638-4575-9d44-d0d2bfc70e08';
  creator uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  ov uuid; mn uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Overview', 'procedure', 'This SOP explains how to securely mail original client documents such as LPR cards, EADs, Social Security cards, and approval notices. It ensures accurate documentation in Filevine, verified mailing details, and proper USPS tracking to maintain accountability and protect client information.', creator, 1)
  RETURNING id INTO ov;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (ov, 'Purpose & Target', '', 1, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Sending Original Documents (LPR, EAD, SSC, Approvals)', 'procedure', '', creator, 2)
  RETURNING id INTO mn;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (mn, 'Introduction', '', 1, creator),
    (mn, 'Locate Client Record in Filevine', '', 2, creator),
    (mn, 'Contact the Client', '', 3, creator),
    (mn, 'Confirm Mailing Address', '', 4, creator),
    (mn, 'Prepare and Ship the Documents', '', 5, creator),
    (mn, 'Record Tracking Number', '', 6, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Knowledge Check', 'procedure', '', creator, 3);
END $$;
