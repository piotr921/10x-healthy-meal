-- Migration: disable_rls_completely
-- Description: Completely disables Row Level Security on all tables for MVP development.
-- This allows the application to work without authentication while we focus on core functionality.
-- Affected Tables: dietary_preferences, forbidden_ingredients, recipes

-- Disable RLS entirely on dietary_preferences table
ALTER TABLE public.dietary_preferences DISABLE ROW LEVEL SECURITY;

-- Disable RLS entirely on forbidden_ingredients table
ALTER TABLE public.forbidden_ingredients DISABLE ROW LEVEL SECURITY;

-- Disable RLS entirely on recipes table
ALTER TABLE public.recipes DISABLE ROW LEVEL SECURITY;
