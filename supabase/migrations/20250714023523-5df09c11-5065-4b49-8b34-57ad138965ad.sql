-- Create subscription plans table
CREATE TABLE public.subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price_cents INTEGER NOT NULL,
  price_period TEXT NOT NULL DEFAULT 'month', -- month, year
  max_users INTEGER NOT NULL DEFAULT 1,
  features JSONB DEFAULT '[]'::jsonb,
  stripe_price_id TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create user subscriptions table
CREATE TABLE public.user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, canceled, past_due
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS policies for subscription_plans
CREATE POLICY "Anyone can view active subscription plans" ON public.subscription_plans
FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" ON public.subscription_plans
FOR ALL USING (is_admin_user());

-- RLS policies for user_subscriptions
CREATE POLICY "Users can view their own subscription" ON public.user_subscriptions
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions" ON public.user_subscriptions
FOR SELECT USING (is_admin_user());

CREATE POLICY "System can create subscriptions" ON public.user_subscriptions
FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update subscriptions" ON public.user_subscriptions
FOR UPDATE USING (true);

-- Insert default subscription plans
INSERT INTO public.subscription_plans (name, description, price_cents, max_users, features) VALUES
('Starter Package', 'Perfect for small teams getting started', 20000, 5, '["Up to 5 users", "Basic support", "Core features"]'::jsonb),
('Law Firms', 'Designed for growing law firms', 18000, 10, '["Up to 10 users", "Priority support", "Advanced features", "Custom branding"]'::jsonb),
('Enterprise', 'For large organizations with complex needs', 17000, 50, '["Up to 50 users", "24/7 dedicated support", "All features", "Custom integrations", "Advanced analytics"]'::jsonb);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language plpgsql;

CREATE TRIGGER update_subscription_plans_updated_at BEFORE UPDATE ON public.subscription_plans
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_subscriptions_updated_at BEFORE UPDATE ON public.user_subscriptions
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();