
DO $$
DECLARE
  cat_id uuid := '1f204167-b698-409c-bca9-f5dff5b6f757';
  creator uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  ov uuid; mn uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Overview', 'procedure', 'This SOP outlines how to mail documents to clients for original signatures, ensuring every mailing is verified, logged, and traceable in Filevine. It provides clear steps for confirming client addresses, preparing mailing packets, recording tracking numbers, and maintaining accountability for all mailed legal documents.', creator, 1)
  RETURNING id INTO ov;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (ov, 'Purpose & Target', '', 1, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Mailing Forms to Client for Original Signature', 'procedure', '', creator, 2)
  RETURNING id INTO mn;
  INSERT INTO wiki_pages (article_id, title, content, sort_order, created_by) VALUES
    (mn, 'Introduction', '', 1, creator),
    (mn, 'Locate the client in Filevine', '', 2, creator),
    (mn, 'Contact the Client', '', 3, creator),
    (mn, 'Confirm Mailing Address', '', 4, creator),
    (mn, 'Prepare and Send the Packet', '', 5, creator),
    (mn, 'Record Tracking Number', '', 6, creator);

  INSERT INTO wiki_articles (category_id, title, subject_category, content, created_by, sort_order)
  VALUES (cat_id, 'Knowledge Check', 'procedure', '', creator, 3);
END $$;
