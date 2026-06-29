
DO $$
DECLARE
  v_cat uuid := '715c0e88-f62f-41f7-afc8-df0939075a8c';
  v_owner uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  v_overview uuid;
  v_main uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, subject_category, owner_id, sort_order, created_by)
  VALUES (v_cat, 'Overview', 'procedure', v_owner, 1, v_owner) RETURNING id INTO v_overview;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES (v_overview, 'Purpose & Target', 1, v_owner);

  INSERT INTO wiki_articles (category_id, title, subject_category, owner_id, sort_order, created_by)
  VALUES (v_cat, 'Determine Services and Communicate with Detention Clients', 'procedure', v_owner, 2, v_owner) RETURNING id INTO v_main;
  INSERT INTO wiki_pages (article_id, title, sort_order, created_by) VALUES
    (v_main, 'Introduction', 1, v_owner),
    (v_main, 'Review completed case assessment and determine communication approach', 2, v_owner),
    (v_main, 'Contact client with appropriate script (qualifying vs. non-qualifying vs. referral)', 3, v_owner),
    (v_main, 'Explain detention status, facility information, and expected timelines', 4, v_owner),
    (v_main, 'Present service options with clear pricing and scope explanations', 5, v_owner),
    (v_main, 'Document client decisions and execute next steps (agreements, referrals, scheduling)', 6, v_owner);

  INSERT INTO wiki_articles (category_id, title, subject_category, owner_id, sort_order, created_by)
  VALUES (v_cat, 'Knowledge Check', 'procedure', v_owner, 3, v_owner);
END $$;
