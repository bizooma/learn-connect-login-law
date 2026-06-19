
CREATE TABLE public.organization_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  singleton BOOLEAN NOT NULL DEFAULT true UNIQUE,
  name TEXT NOT NULL DEFAULT 'New Frontier Immigration Law',
  employee_count TEXT,
  industry TEXT DEFAULT 'Legal',
  phone TEXT,
  website TEXT,
  logo_url TEXT,
  logo_bg_color TEXT DEFAULT '#ffffff',
  accent_color TEXT DEFAULT '#213C82',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID,
  CONSTRAINT organization_settings_singleton_check CHECK (singleton = true)
);

GRANT SELECT, INSERT, UPDATE ON public.organization_settings TO authenticated;
GRANT ALL ON public.organization_settings TO service_role;

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view org settings"
  ON public.organization_settings FOR SELECT
  TO authenticated USING (true);

CREATE POLICY "Admins can insert org settings"
  ON public.organization_settings FOR INSERT
  TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update org settings"
  ON public.organization_settings FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_organization_settings_updated_at
  BEFORE UPDATE ON public.organization_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.organization_settings (singleton, name, industry)
VALUES (true, 'New Frontier Immigration Law', 'Legal')
ON CONFLICT (singleton) DO NOTHING;

-- Storage policies for org-branding bucket (bucket created via Lovable Cloud UI)
CREATE POLICY "Public can view org branding"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'org-branding');

CREATE POLICY "Admins can upload org branding"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'org-branding' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update org branding"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'org-branding' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete org branding"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'org-branding' AND public.has_role(auth.uid(), 'admin'));
