import { defineMiddleware } from 'astro:middleware';

import { createSupabaseServerInstance } from '../db/supabase.client.ts';

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/auth/login',
  '/auth/register',
  '/auth/restore-password',
  '/auth/update-password',
  '/auth/callback',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/restore-password',
];

// Paths that require authentication
const PROTECTED_PATH_PREFIX = '/app';

export const onRequest = defineMiddleware(async ({ locals, cookies, url, request, redirect }, next) => {
  const pathname = url.pathname;

  // Redirect root to login page
  if (pathname === '/') {
    return redirect('/auth/login');
  }

  // Skip auth check for public paths
  if (PUBLIC_PATHS.includes(pathname)) {
    return next();
  }

  // Create Supabase instance
  const supabase = createSupabaseServerInstance({
    cookies,
    headers: request.headers,
  });

  // Store supabase instance in locals for use in routes
  locals.supabase = supabase;

  // Get user session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Store user in locals if authenticated
  if (user) {
    locals.user = {
      email: user.email ?? '',
      id: user.id,
    };
  }

  // Protect /app/* routes
  if (pathname.startsWith(PROTECTED_PATH_PREFIX) && !user) {
    return redirect('/auth/login');
  }

  return next();
});
