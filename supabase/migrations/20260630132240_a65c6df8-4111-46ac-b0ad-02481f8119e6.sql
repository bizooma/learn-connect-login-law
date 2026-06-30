
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS content_public_share_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS content_pdf_downloads_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS content_esignature_permission text NOT NULL DEFAULT 'billing_admin',
  ADD COLUMN IF NOT EXISTS content_feedback_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS content_default_discoverability text NOT NULL DEFAULT 'discoverable';
