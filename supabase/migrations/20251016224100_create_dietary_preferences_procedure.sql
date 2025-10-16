-- Create stored procedure for creating dietary preferences with ingredients
CREATE OR REPLACE FUNCTION public.create_dietary_preferences(
    p_user_id UUID,
    p_diet_type diet_type_enum,
    p_forbidden_ingredients text[]
)
RETURNS public.dietary_preferences
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_preferences dietary_preferences;
BEGIN
    -- Insert dietary preferences
    INSERT INTO public.dietary_preferences (user_id, diet_type)
    VALUES (p_user_id, p_diet_type)
    RETURNING * INTO v_preferences;

    -- Insert forbidden ingredients
    IF array_length(p_forbidden_ingredients, 1) > 0 THEN
        INSERT INTO public.forbidden_ingredients (dietary_preferences_id, ingredient_name)
        SELECT v_preferences.id, unnest(p_forbidden_ingredients);
    END IF;

    RETURN v_preferences;
END;
$$;
