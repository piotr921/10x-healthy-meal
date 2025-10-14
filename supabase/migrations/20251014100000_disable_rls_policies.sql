-- Migration: disable_rls_policies
-- Description: Disables all RLS policies from the tables defined in the initial schema.
-- Affected Tables: dietary_preferences, forbidden_ingredients, recipes

--
-- Disable RLS Policies for dietary_preferences
--

-- disable select policy for authenticated users on dietary_preferences
drop policy "allow authenticated select on dietary_preferences" on public.dietary_preferences;

-- disable insert policy for authenticated users on dietary_preferences
drop policy "allow authenticated insert on dietary_preferences" on public.dietary_preferences;

-- disable update policy for authenticated users on dietary_preferences
drop policy "allow authenticated update on dietary_preferences" on public.dietary_preferences;

-- disable delete policy for authenticated users on dietary_preferences
drop policy "allow authenticated delete on dietary_preferences" on public.dietary_preferences;

--
-- Disable RLS Policies for forbidden_ingredients
--

-- disable select policy for authenticated users on forbidden_ingredients
drop policy "allow authenticated select on forbidden_ingredients" on public.forbidden_ingredients;

-- disable insert policy for authenticated users on forbidden_ingredients
drop policy "allow authenticated insert on forbidden_ingredients" on public.forbidden_ingredients;

-- disable update policy for authenticated users on forbidden_ingredients
drop policy "allow authenticated update on forbidden_ingredients" on public.forbidden_ingredients;

-- disable delete policy for authenticated users on forbidden_ingredients
drop policy "allow authenticated delete on forbidden_ingredients" on public.forbidden_ingredients;

--
-- Disable RLS Policies for recipes
--

-- disable select policy for authenticated users on recipes
drop policy "allow authenticated select on recipes" on public.recipes;

-- disable insert policy for authenticated users on recipes
drop policy "allow authenticated insert on recipes" on public.recipes;

-- disable update policy for authenticated users on recipes
drop policy "allow authenticated update on recipes" on public.recipes;

-- disable delete policy for authenticated users on recipes
drop policy "allow authenticated delete on recipes" on public.recipes;

