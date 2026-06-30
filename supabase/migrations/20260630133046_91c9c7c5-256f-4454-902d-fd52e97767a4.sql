
ALTER TABLE public.organization_settings
  ADD COLUMN IF NOT EXISTS people_directory_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS people_directory_restricted_groups uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS people_chart_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS people_chart_restricted_groups uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS people_role_chart_enabled boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS people_role_chart_restricted_groups uuid[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS people_share_reports_direct_reports boolean NOT NULL DEFAULT true;
