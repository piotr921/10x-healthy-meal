-- Migration: initial_schema
-- Description: Sets up the initial database schema for the HealthyMeal project.
-- Affected Tables: dietary_preferences, forbidden_ingredients, recipes
-- Special Considerations: This migration assumes the existence of the auth.users table managed by Supabase.

-- create the diet_type enum
create type public.diet_type_enum as enum ('vegan', 'vegetarian', 'none');

-- create the dietary_preferences table
-- This table stores the dietary preferences for each user.
create table public.dietary_preferences (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    diet_type public.diet_type_enum not null,
    version integer not null default 1,
    updated_at timestamptz not null default now(),
    created_at timestamptz not null default now(),
    constraint dietary_preferences_pkey primary key (id),
    constraint dietary_preferences_user_id_key unique (user_id),
    constraint dietary_preferences_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade
);

-- add comments to the columns
comment on table public.dietary_preferences is 'Stores user-specific dietary preferences.';
comment on column public.dietary_preferences.user_id is 'Links to the user in auth.users.';

-- enable row level security for dietary_preferences
alter table public.dietary_preferences enable row level security;

-- create the forbidden_ingredients table
-- This table stores ingredients that a user wants to avoid.
create table public.forbidden_ingredients (
    id uuid not null default gen_random_uuid(),
    dietary_preferences_id uuid not null,
    ingredient_name text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    constraint forbidden_ingredients_pkey primary key (id),
    constraint forbidden_ingredients_dietary_preferences_id_fkey foreign key (dietary_preferences_id) references public.dietary_preferences (id) on delete cascade
);

-- add comments to the columns
comment on table public.forbidden_ingredients is 'Stores ingredients forbidden for a user based on their dietary preferences.';
comment on column public.forbidden_ingredients.dietary_preferences_id is 'Links to the dietary preferences.';

-- enable row level security for forbidden_ingredients
alter table public.forbidden_ingredients enable row level security;

-- create the recipes table
-- This table stores user-created recipes.
create table public.recipes (
    id uuid not null default gen_random_uuid(),
    user_id uuid not null,
    title text not null,
    content text not null,
    update_counter integer not null default 1,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    deleted_at timestamptz,
    constraint recipes_pkey primary key (id),
    constraint recipes_user_id_fkey foreign key (user_id) references auth.users (id) on delete cascade,
    constraint recipes_user_id_title_key unique (user_id, title)
);

-- add comments to the columns
comment on table public.recipes is 'Stores recipes created by users.';
comment on column public.recipes.deleted_at is 'Timestamp for soft deletes.';

-- enable row level security for recipes
alter table public.recipes enable row level security;

--
-- RLS Policies for dietary_preferences
--

-- allow authenticated users to select their own dietary preferences
create policy "allow authenticated select on dietary_preferences"
on public.dietary_preferences for select
to authenticated
using (auth.uid() = user_id);

-- allow authenticated users to insert their own dietary preferences
create policy "allow authenticated insert on dietary_preferences"
on public.dietary_preferences for insert
to authenticated
with check (auth.uid() = user_id);

-- allow authenticated users to update their own dietary preferences
create policy "allow authenticated update on dietary_preferences"
on public.dietary_preferences for update
to authenticated
using (auth.uid() = user_id);

-- allow authenticated users to delete their own dietary preferences
create policy "allow authenticated delete on dietary_preferences"
on public.dietary_preferences for delete
to authenticated
using (auth.uid() = user_id);

--
-- RLS Policies for forbidden_ingredients
--

-- allow authenticated users to select their own forbidden ingredients
create policy "allow authenticated select on forbidden_ingredients"
on public.forbidden_ingredients for select
to authenticated
using (
  exists (
    select 1 from public.dietary_preferences
    where dietary_preferences.id = forbidden_ingredients.dietary_preferences_id
    and dietary_preferences.user_id = auth.uid()
  )
);

-- allow authenticated users to insert their own forbidden ingredients
create policy "allow authenticated insert on forbidden_ingredients"
on public.forbidden_ingredients for insert
to authenticated
with check (
  exists (
    select 1 from public.dietary_preferences
    where dietary_preferences.id = forbidden_ingredients.dietary_preferences_id
    and dietary_preferences.user_id = auth.uid()
  )
);

-- allow authenticated users to update their own forbidden ingredients
create policy "allow authenticated update on forbidden_ingredients"
on public.forbidden_ingredients for update
to authenticated
using (
  exists (
    select 1 from public.dietary_preferences
    where dietary_preferences.id = forbidden_ingredients.dietary_preferences_id
    and dietary_preferences.user_id = auth.uid()
  )
);

-- allow authenticated users to delete their own forbidden ingredients
create policy "allow authenticated delete on forbidden_ingredients"
on public.forbidden_ingredients for delete
to authenticated
using (
  exists (
    select 1 from public.dietary_preferences
    where dietary_preferences.id = forbidden_ingredients.dietary_preferences_id
    and dietary_preferences.user_id = auth.uid()
  )
);

--
-- RLS Policies for recipes
--

-- allow authenticated users to select their own recipes
create policy "allow authenticated select on recipes"
on public.recipes for select
to authenticated
using (auth.uid() = user_id);

-- allow authenticated users to insert their own recipes
create policy "allow authenticated insert on recipes"
on public.recipes for insert
to authenticated
with check (auth.uid() = user_id);

-- allow authenticated users to update their own recipes
create policy "allow authenticated update on recipes"
on public.recipes for update
to authenticated
using (auth.uid() = user_id);

-- allow authenticated users to delete their own recipes
create policy "allow authenticated delete on recipes"
on public.recipes for delete
to authenticated
using (auth.uid() = user_id);

