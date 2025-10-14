# HealthyMeal PostgreSQL Database Schema

## 1. Tables

### users *(managed by Supabase Auth)*
| Column                | Data Type      | Constraints                                  |
|---------------------- |---------------|----------------------------------------------|
| id                    | uuid           | PRIMARY KEY, DEFAULT gen_random_uuid()       |
| email                 | text           | NOT NULL, UNIQUE                            |
| password_hash         | text           | NOT NULL                                     |
| dietary_preferences_id| uuid           | REFERENCES dietary_preferences(id)           |
| created_at            | timestamptz    | NOT NULL, DEFAULT now()                      |
| updated_at            | timestamptz    | NOT NULL, DEFAULT now()                      |

### dietary_preferences
| Column         | Data Type      | Constraints                                  |
|----------------|---------------|----------------------------------------------|
| id             | uuid           | PRIMARY KEY, DEFAULT gen_random_uuid()       |
| user_id        | uuid           | NOT NULL, UNIQUE, REFERENCES users(id)       |
| diet_type      | diet_type_enum | NOT NULL                                     |
| version        | integer        | NOT NULL, DEFAULT 1                          |
| updated_at     | timestamptz    | NOT NULL, DEFAULT now()                      |
| created_at     | timestamptz    | NOT NULL, DEFAULT now()                      |

### forbidden_ingredients
| Column                 | Data Type      | Constraints                                  |
|------------------------|---------------|----------------------------------------------|
| id                     | uuid           | PRIMARY KEY, DEFAULT gen_random_uuid()       |
| dietary_preferences_id | uuid           | NOT NULL, REFERENCES dietary_preferences(id) ON DELETE CASCADE |
| ingredient_name        | text           | NOT NULL                                     |
| created_at             | timestamptz    | NOT NULL, DEFAULT now()                      |
| updated_at             | timestamptz    | NOT NULL, DEFAULT now()                      |

### recipes
| Column         | Data Type      | Constraints                                  |
|----------------|---------------|----------------------------------------------|
| id             | uuid           | PRIMARY KEY, DEFAULT gen_random_uuid()       |
| user_id        | uuid           | NOT NULL, REFERENCES users(id)               |
| title          | text           | NOT NULL                                     |
| content        | text           | NOT NULL                                     |
| update_counter | integer        | NOT NULL, DEFAULT 1                          |
| created_at     | timestamptz    | NOT NULL, DEFAULT now()                      |
| updated_at     | timestamptz    | NOT NULL, DEFAULT now()                      |
| deleted_at     | timestamptz    | NULLABLE                                     |

### diet_type_enum (ENUM)
- vegan
- vegetarian
- none

## 2. Relationships
- users (1) --- (1) dietary_preferences (via user_id, unique)
- dietary_preferences (1) --- (M) forbidden_ingredients
- users (1) --- (M) recipes

## 3. Indexes
- users: UNIQUE(email)
- recipes: UNIQUE(user_id, title)
- recipes: INDEX(user_id, created_at)
- forbidden_ingredients: INDEX(dietary_preferences_id)

## 4. PostgreSQL Row-Level Security (RLS) Policies

### Enable RLS
- `ALTER TABLE users ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE dietary_preferences ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE forbidden_ingredients ENABLE ROW LEVEL SECURITY;`
- `ALTER TABLE recipes ENABLE ROW LEVEL SECURITY;`

### Example Policies
- Users can access only their own user row:
  ```sql
  CREATE POLICY select_own_user ON users
    FOR SELECT USING (id = auth.uid());
  ```
- Users can access only their own dietary_preferences:
  ```sql
  CREATE POLICY select_own_dietary_preferences ON dietary_preferences
    FOR SELECT USING (user_id = auth.uid());
  ```
- Users can access only their own forbidden_ingredients:
  ```sql
  CREATE POLICY select_own_forbidden_ingredients ON forbidden_ingredients
    FOR SELECT USING (
      dietary_preferences_id IN (SELECT id FROM dietary_preferences WHERE user_id = auth.uid())
    );
  ```
- Users can access only their own recipes:
  ```sql
  CREATE POLICY select_own_recipes ON recipes
    FOR SELECT USING (user_id = auth.uid());
  ```

## 5. Additional Notes
- All tables include audit fields (`created_at`, `updated_at`).
- Soft deletes for recipes are implemented via the `deleted_at` column.
- Foreign key constraints are enforced for all relationships.
- `diet_type_enum` can be extended for future diet types.
- All user data is isolated via RLS.
- The schema is normalized to 3NF for maintainability and scalability.
