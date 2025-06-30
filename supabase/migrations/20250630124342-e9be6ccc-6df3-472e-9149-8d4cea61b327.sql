
-- Step 1: Initialize learning streaks based on existing user activity
INSERT INTO user_learning_streaks (
  user_id,
  current_streak,
  longest_streak,
  last_activity_date,
  streak_start_date,
  is_active
)
SELECT DISTINCT
  uup.user_id,
  CASE 
    WHEN MAX(uup.completed_at)::date >= CURRENT_DATE - INTERVAL '7 days' THEN 
      LEAST(COUNT(DISTINCT DATE(uup.completed_at)), 7)
    ELSE 1
  END as current_streak,
  LEAST(COUNT(DISTINCT DATE(uup.completed_at)), 30) as longest_streak,
  MAX(uup.completed_at)::date as last_activity_date,
  MIN(uup.completed_at)::date as streak_start_date,
  CASE 
    WHEN MAX(uup.completed_at)::date >= CURRENT_DATE - INTERVAL '7 days' THEN true
    ELSE false
  END as is_active
FROM user_unit_progress uup
JOIN profiles p ON uup.user_id = p.id
WHERE uup.completed = true 
  AND p.is_deleted = false
  AND NOT EXISTS (
    SELECT 1 FROM user_learning_streaks uls 
    WHERE uls.user_id = uup.user_id
  )
GROUP BY uup.user_id
HAVING COUNT(DISTINCT uup.unit_id) > 0;

-- Step 2: Populate the leaderboard cache with learning streak data
INSERT INTO leaderboard_cache (
  leaderboard_type,
  user_id,
  user_name,
  user_email,
  score,
  rank_position,
  additional_data
)
SELECT 
  'learning_streak' as leaderboard_type,
  uls.user_id,
  CONCAT(p.first_name, ' ', p.last_name) as user_name,
  p.email as user_email,
  uls.current_streak as score,
  ROW_NUMBER() OVER (ORDER BY uls.current_streak DESC, uls.longest_streak DESC) as rank_position,
  jsonb_build_object(
    'current_streak', uls.current_streak,
    'longest_streak', uls.longest_streak
  ) as additional_data
FROM user_learning_streaks uls
JOIN profiles p ON uls.user_id = p.id
WHERE uls.current_streak >= 1
  AND p.is_deleted = false
ORDER BY uls.current_streak DESC, uls.longest_streak DESC
LIMIT 50;

-- Step 3: Populate sales training leaderboard cache
INSERT INTO leaderboard_cache (
  leaderboard_type,
  user_id,
  user_name,
  user_email,
  score,
  rank_position,
  additional_data
)
SELECT 
  'sales_training' as leaderboard_type,
  ranked_users.user_id,
  ranked_users.user_name,
  ranked_users.user_email,
  ranked_users.completion_rate as score,
  ranked_users.rank_position,
  jsonb_build_object(
    'courses_completed', ranked_users.courses_completed,
    'total_courses', ranked_users.total_courses,
    'completion_rate', ranked_users.completion_rate
  ) as additional_data
FROM (
  SELECT 
    ca.user_id,
    CONCAT(p.first_name, ' ', p.last_name) as user_name,
    p.email as user_email,
    ROUND(
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
        ELSE 0 
      END, 2
    ) as completion_rate,
    COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) as courses_completed,
    COUNT(*) as total_courses,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
          ELSE 0 
        END DESC,
        COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) DESC
    ) as rank_position
  FROM course_assignments ca
  JOIN courses c ON ca.course_id = c.id
  JOIN profiles p ON ca.user_id = p.id
  LEFT JOIN user_course_progress ucp ON ca.user_id = ucp.user_id AND ca.course_id = ucp.course_id
  WHERE c.category = 'Sales' AND p.is_deleted = false
  GROUP BY ca.user_id, p.first_name, p.last_name, p.email
  HAVING COUNT(*) > 0
) ranked_users
LIMIT 50;

-- Step 4: Populate legal training leaderboard cache
INSERT INTO leaderboard_cache (
  leaderboard_type,
  user_id,
  user_name,
  user_email,
  score,
  rank_position,
  additional_data
)
SELECT 
  'legal_training' as leaderboard_type,
  ranked_users.user_id,
  ranked_users.user_name,
  ranked_users.user_email,
  ranked_users.completion_rate as score,
  ranked_users.rank_position,
  jsonb_build_object(
    'courses_completed', ranked_users.courses_completed,
    'total_courses', ranked_users.total_courses,
    'completion_rate', ranked_users.completion_rate
  ) as additional_data
FROM (
  SELECT 
    ca.user_id,
    CONCAT(p.first_name, ' ', p.last_name) as user_name,
    p.email as user_email,
    ROUND(
      CASE 
        WHEN COUNT(*) > 0 THEN 
          (COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
        ELSE 0 
      END, 2
    ) as completion_rate,
    COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) as courses_completed,
    COUNT(*) as total_courses,
    ROW_NUMBER() OVER (
      ORDER BY 
        CASE 
          WHEN COUNT(*) > 0 THEN 
            (COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) * 100.0 / COUNT(*))
          ELSE 0 
        END DESC,
        COUNT(CASE WHEN ucp.status = 'completed' THEN 1 END) DESC
    ) as rank_position
  FROM course_assignments ca
  JOIN courses c ON ca.course_id = c.id
  JOIN profiles p ON ca.user_id = p.id
  LEFT JOIN user_course_progress ucp ON ca.user_id = ucp.user_id AND ca.course_id = ucp.course_id
  WHERE c.category = 'Legal' AND p.is_deleted = false
  GROUP BY ca.user_id, p.first_name, p.last_name, p.email
  HAVING COUNT(*) > 0
) ranked_users
LIMIT 50;
