
-- Phase 1: Database Extension - Add team_leader role and team assignment functionality

-- Add team_leader to the existing app_role enum
ALTER TYPE app_role ADD VALUE 'team_leader';

-- Add team assignment field to profiles table
ALTER TABLE profiles ADD COLUMN team_leader_id UUID REFERENCES profiles(id);

-- Add index for performance on team leader lookups
CREATE INDEX idx_profiles_team_leader_id ON profiles(team_leader_id);

-- Add comment for documentation
COMMENT ON COLUMN profiles.team_leader_id IS 'References the team leader for this user. NULL if user is not assigned to a team.';
