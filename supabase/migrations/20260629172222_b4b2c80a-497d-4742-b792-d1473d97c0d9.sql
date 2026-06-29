
DO $$
DECLARE
  cat_id uuid := '5ab328fd-5005-418b-92cd-c67efbaeb208';
  cb uuid := 'b8ed63e9-60bc-4ddd-b7ad-01bf62a48f88';
  a_overview uuid; a_closure uuid; a_withdraw uuid; a_back uuid; a_recap uuid;
BEGIN
  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Overview', 'document', 1, true, cb) RETURNING id INTO a_overview;
  INSERT INTO wiki_pages (article_id, title, sort_order, is_published, created_by) VALUES
    (a_overview, 'Purpose & Target', 1, true, cb);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Case Closure Procedures (3.10.1)', 'document', 2, true, cb) RETURNING id INTO a_closure;
  INSERT INTO wiki_pages (article_id, title, sort_order, is_published, created_by) VALUES
    (a_closure, 'Introduction', 1, true, cb),
    (a_closure, 'Ensure Casework Completion and Determine Reason for Closure', 2, true, cb),
    (a_closure, 'Finance Review', 3, true, cb),
    (a_closure, 'Client Communication', 4, true, cb),
    (a_closure, 'Archive', 5, true, cb);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Process a Case Withdrawal (3.10.2)', 'document', 3, true, cb) RETURNING id INTO a_withdraw;
  INSERT INTO wiki_pages (article_id, title, sort_order, is_published, created_by) VALUES
    (a_withdraw, 'Introduction', 1, true, cb),
    (a_withdraw, 'Attorney evaluates and confirms withdrawal is necessary', 2, true, cb),
    (a_withdraw, 'Attorney obtains leadership approval if required', 3, true, cb),
    (a_withdraw, 'Paralegal prepares and sends withdrawal letter (email + hard copy)', 4, true, cb),
    (a_withdraw, 'Mail withdrawal letter following filing case items SOP', 5, true, cb),
    (a_withdraw, 'Attorney updates case phase in Filevine to reflect closure', 6, true, cb),
    (a_withdraw, 'If reinstatement is requested, attorney evaluates and follows add-on/change of contract process', 7, true, cb);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Back to Sales (3.10.3)', 'document', 4, false, cb) RETURNING id INTO a_back;

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Subject Recap', 'document', 5, true, cb) RETURNING id INTO a_recap;
  INSERT INTO wiki_pages (article_id, title, sort_order, is_published, created_by) VALUES
    (a_recap, 'Target', 1, true, cb);

  INSERT INTO wiki_articles (category_id, title, content_type, sort_order, is_published, created_by)
  VALUES (cat_id, 'Knowledge Check', 'test', 6, true, cb);
END $$;
