-- Create support tickets table
CREATE TABLE public.support_tickets (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_name text NOT NULL,
  user_email text NOT NULL,
  user_role text NOT NULL,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'open',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can create their own support tickets" 
ON public.support_tickets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own support tickets" 
ON public.support_tickets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all support tickets" 
ON public.support_tickets 
FOR SELECT 
USING (is_admin_user());

CREATE POLICY "Admins can update all support tickets" 
ON public.support_tickets 
FOR UPDATE 
USING (is_admin_user());

-- Create chatbot interactions table for analytics
CREATE TABLE public.chatbot_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  user_role text NOT NULL,
  question text NOT NULL,
  response text NOT NULL,
  response_type text NOT NULL DEFAULT 'knowledge_base', -- 'knowledge_base', 'ai_generated', 'escalated'
  helpful boolean,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for chatbot interactions
ALTER TABLE public.chatbot_interactions ENABLE ROW LEVEL SECURITY;

-- Create policies for chatbot interactions
CREATE POLICY "Users can create their own chatbot interactions" 
ON public.chatbot_interactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own chatbot interactions" 
ON public.chatbot_interactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all chatbot interactions" 
ON public.chatbot_interactions 
FOR SELECT 
USING (is_admin_user());

-- Create updated_at trigger for support_tickets
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();