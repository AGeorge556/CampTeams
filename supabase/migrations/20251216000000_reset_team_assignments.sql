-- Migration: Reset Team Assignments for New Camp Session
-- Date: 2025-12-16
-- Description: Reset all team assignments and switches for the new Winter Camp 2026

-- Reset all user team assignments (except admins)
UPDATE profiles
SET
  current_team = NULL,
  preferred_team = NULL,
  switches_remaining = 3
WHERE is_admin = false;

-- Clear all team switch history
TRUNCATE TABLE team_switches;

-- Reset scoreboard scores
TRUNCATE TABLE scoreboard_scores;

-- Note: This migration resets teams for the new camp session
-- Run this migration before the new camp begins
