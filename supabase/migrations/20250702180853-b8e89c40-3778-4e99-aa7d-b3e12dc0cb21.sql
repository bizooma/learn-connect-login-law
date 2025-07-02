-- Add admin RLS policies for user_video_progress table to allow video completion repair tool to work

-- Allow admins to view all user video progress
CREATE POLICY "Admins can view all video progress" 
ON public.user_video_progress 
FOR SELECT 
USING (is_admin_user());

-- Allow admins to manage all user video progress  
CREATE POLICY "Admins can manage all video progress"
ON public.user_video_progress
FOR ALL
USING (is_admin_user());