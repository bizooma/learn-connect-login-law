-- Enable Row Level Security on the completion_migration_backup table
ALTER TABLE public.completion_migration_backup ENABLE ROW LEVEL SECURITY;

-- Add a policy to allow admins to view backup data
CREATE POLICY "Admins can view completion migration backup data" 
ON public.completion_migration_backup 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add a policy to allow system operations (for backup processes)
CREATE POLICY "System can manage completion migration backup data" 
ON public.completion_migration_backup 
FOR ALL 
USING (true)
WITH CHECK (true);