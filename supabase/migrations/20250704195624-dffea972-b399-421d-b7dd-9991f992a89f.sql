-- Create storage policies for certificate templates (if they don't exist)
DO $$ 
BEGIN
  -- Check and create policies for certificate templates storage
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Admins can upload certificate templates'
  ) THEN
    CREATE POLICY "Admins can upload certificate templates" 
    ON storage.objects 
    FOR INSERT 
    WITH CHECK (bucket_id = 'certificate-templates' AND auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Everyone can view certificate templates'
  ) THEN
    CREATE POLICY "Everyone can view certificate templates" 
    ON storage.objects 
    FOR SELECT 
    USING (bucket_id = 'certificate-templates');
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Admins can update certificate templates'
  ) THEN
    CREATE POLICY "Admins can update certificate templates" 
    ON storage.objects 
    FOR UPDATE 
    USING (bucket_id = 'certificate-templates' AND auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    ));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Admins can delete certificate templates'
  ) THEN
    CREATE POLICY "Admins can delete certificate templates" 
    ON storage.objects 
    FOR DELETE 
    USING (bucket_id = 'certificate-templates' AND auth.uid() IN (
      SELECT user_id FROM public.user_roles WHERE role = 'admin'
    ));
  END IF;
END $$;

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