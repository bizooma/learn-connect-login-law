-- Create a storage bucket for support assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('support-assets', 'support-assets', true);

-- Create policies for the support-assets bucket
CREATE POLICY "Support assets are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'support-assets');

CREATE POLICY "Admins can upload support assets" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'support-assets' AND auth.uid() IS NOT NULL);