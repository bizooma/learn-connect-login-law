-- Create storage bucket for certificate templates
INSERT INTO storage.buckets (id, name, public) 
VALUES ('certificate-templates', 'certificate-templates', true);

-- Create storage policies for certificate templates
CREATE POLICY "Admins can upload certificate templates" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'certificate-templates' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

CREATE POLICY "Everyone can view certificate templates" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'certificate-templates');

CREATE POLICY "Admins can update certificate templates" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'certificate-templates' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

CREATE POLICY "Admins can delete certificate templates" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'certificate-templates' AND auth.uid() IN (
  SELECT user_id FROM public.user_roles WHERE role = 'admin'
));

-- Update certificate_templates table to use Supabase storage
ALTER TABLE public.certificate_templates 
ADD COLUMN IF NOT EXISTS storage_path text,
ADD COLUMN IF NOT EXISTS file_size bigint,
ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'image/png';

-- Update RLS policies for certificate templates to allow admin management
DROP POLICY IF EXISTS "Admins can manage certificate templates" ON public.certificate_templates;
CREATE POLICY "Admins can manage certificate templates" 
ON public.certificate_templates 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.user_roles 
  WHERE user_id = auth.uid() AND role = 'admin'
));