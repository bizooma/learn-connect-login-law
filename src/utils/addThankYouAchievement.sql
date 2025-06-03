
-- Add the "Thank You" achievement
INSERT INTO public.achievements (
  name,
  description,
  category,
  rarity,
  badge_color,
  badge_icon,
  points_required,
  is_active
) VALUES (
  'Thank You',
  'No complaining about our new training system',
  'humor',
  'legendary',
  '#FFD700',
  'star',
  NULL,
  true
) ON CONFLICT (name) DO NOTHING;
