-- Migration: Add contact information fields to camp registrations
-- Date: 2025-12-18
-- Description: Add age, mobile number, parent name, and parent number to camp_registrations

-- Add new columns to camp_registrations table
ALTER TABLE camp_registrations
  ADD COLUMN IF NOT EXISTS age INTEGER,
  ADD COLUMN IF NOT EXISTS mobile_number TEXT,
  ADD COLUMN IF NOT EXISTS parent_name TEXT,
  ADD COLUMN IF NOT EXISTS parent_number TEXT;

-- Add check constraint for age (reasonable age range for campers)
ALTER TABLE camp_registrations
  ADD CONSTRAINT camp_registrations_age_check
  CHECK (age IS NULL OR (age >= 10 AND age <= 25));
