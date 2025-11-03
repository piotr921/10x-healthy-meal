import type { APIRoute } from 'astro';

import { createSupabaseServerInstance } from '../../../db/supabase.client.ts';

export const prerender = false;

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Create Supabase instance
    const supabase = createSupabaseServerInstance({
      cookies,
      headers: request.headers,
    });

    // Sign out
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Logout error:', error);
      return new Response(
        JSON.stringify({
          error: 'Failed to log out. Please try again.',
        }),
        {
          status: 500,
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (error) {
    console.error('Logout error:', error);
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

