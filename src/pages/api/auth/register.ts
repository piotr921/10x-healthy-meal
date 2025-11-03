import type { APIRoute } from 'astro';

import { createSupabaseServerInstance } from '@/db/supabase.client';
import { RegisterSchema } from '@/lib/validation/auth.validation';

export const prerender = false;

// Map Supabase error messages to user-friendly messages
const mapAuthError = (errorMessage: string): string => {
  const errorMap: Record<string, string> = {
    'User already registered': 'An account with this email already exists. Please try logging in instead.',
    'Email rate limit exceeded': 'Too many registration attempts. Please try again later.',
    'Password should be at least': 'Password does not meet security requirements. Please choose a stronger password.',
    'Invalid email': 'Please provide a valid email address.',
    'Signup disabled': 'New user registration is currently disabled.',
  };

  // Check if the error message contains any known patterns
  for (const [key, value] of Object.entries(errorMap)) {
    if (errorMessage.includes(key)) {
      return value;
    }
  }

  // Default error message for unknown errors
  return 'An error occurred during registration. Please try again.';
};

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Parse and validate request body
    const body = await request.json();
    const validationResult = RegisterSchema.safeParse(body);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: 'Invalid input',
          details: validationResult.error.errors,
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    const { email, password } = validationResult.data;

    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Attempt to sign up
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Email confirmation is disabled in local Supabase config
        emailRedirectTo: `${new URL(request.url).origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Registration error:', error);
      return new Response(
        JSON.stringify({
          error: mapAuthError(error.message),
        }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Check if user was created successfully
    if (!data.user) {
      return new Response(
        JSON.stringify({
          error: 'Failed to create user account. Please try again.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    // Return success with user data
    return new Response(
      JSON.stringify({
        success: true,
        message: 'Account created successfully. You can now sign in with your credentials.',
        user: {
          id: data.user.id,
          email: data.user.email,
        },
      }),
      {
        status: 201,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Registration error:', error);
    return new Response(
      JSON.stringify({
        error: 'An unexpected error occurred. Please try again.',
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  }
};

