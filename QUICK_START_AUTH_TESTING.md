# Quick Start Guide - Testing Authentication

## Prerequisites

1. Ensure you have a Supabase project set up
2. Update your `.env` file with correct credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_KEY=your_anon_key
   OPENROUTER_API_KEY=your_openrouter_key
   SITE_URL=http://localhost:3000
   ```

## Supabase Configuration

Before testing, configure the following in your Supabase dashboard:

1. **Authentication Settings** (`Authentication > URL Configuration`):
   - Add to "Redirect URLs": `http://localhost:3000/auth/callback`
   - Site URL: `http://localhost:3000`

2. **Email Settings** (`Authentication > Email Templates`):
   - Ensure email confirmation is enabled
   - Customize templates if needed

## Starting the Application

```bash
# Install dependencies (if not already done)
npm install

# Start development server
npm run dev
```

The application will start on `http://localhost:3000`

## Testing the Login Flow

### Step 1: Create a Test User

Since this integration focuses on login, you need to create a test user first. You can do this in two ways:

**Option A: Via Supabase Dashboard**
1. Go to your Supabase project
2. Navigate to `Authentication > Users`
3. Click "Add user" > "Create new user"
4. Enter email and password
5. Toggle "Auto Confirm User" to ON (for testing)
6. Click "Create user"

**Option B: Via Registration Form** (if already implemented)
1. Navigate to `http://localhost:3000/auth/register`
2. Fill in email and password
3. Submit form
4. Confirm email (check inbox or use Supabase dashboard to confirm manually)

### Step 2: Test Login

1. Navigate to `http://localhost:3000` or `http://localhost:3000/auth/login`
2. You should see the login form
3. Enter the test user credentials:
   - Email: `your-test-email@example.com`
   - Password: `your-test-password`
4. Click "Sign In"
5. You should be redirected to `http://localhost:3000/app/recipes`

### Step 3: Verify Authentication

After successful login, verify:
- ✅ You can access `/app/recipes`
- ✅ You can access `/app/profile/preferences`
- ✅ The header shows "Logout" button and "Profile" link
- ✅ You can create new recipes
- ✅ You can view your recipes
- ✅ You can edit recipes
- ✅ You can delete recipes
- ✅ You can set dietary preferences

### Step 4: Test Protected Routes

1. Open a new incognito/private window
2. Try to access `http://localhost:3000/app/recipes`
3. You should be automatically redirected to `/auth/login`

### Step 5: Test Logout

1. Click the "Logout" button in the header
2. You should be redirected to `/auth/login`
3. Try to access `/app/recipes` again
4. You should be redirected to `/auth/login`

## Testing Error Scenarios

### Invalid Credentials
1. Go to login page
2. Enter invalid email or password
3. Click "Sign In"
4. Verify error message: "Invalid email or password. Please try again."

### Unconfirmed Email
1. Create a user without confirming email (via Supabase dashboard, toggle OFF "Auto Confirm User")
2. Try to login
3. Verify error message about email confirmation

### Empty Fields
1. Try to submit login form with empty email
2. Verify validation error: "Please enter a valid email address."
3. Try to submit with empty password
4. Verify validation error: "Password is required"

## Testing API Endpoints

You can test API endpoints directly using curl or a tool like Postman:

### Login Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

Expected response (success):
```json
{
  "success": true,
  "user": {
    "id": "uuid-here",
    "email": "test@example.com"
  }
}
```

Expected response (error):
```json
{
  "error": "Invalid email or password. Please try again."
}
```

### Logout Endpoint
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Content-Type: application/json" \
  -b "cookies-from-login"
```

Expected response:
```json
{
  "success": true
}
```

## Common Issues & Solutions

### Issue: "Cannot connect to Supabase"
**Solution**: 
- Verify `SUPABASE_URL` and `SUPABASE_KEY` in `.env`
- Check if Supabase project is active
- Verify internet connection

### Issue: "Redirect loop" or "Too many redirects"
**Solution**:
- Check middleware configuration in `src/middleware/index.ts`
- Verify `/auth/login` is in PUBLIC_PATHS
- Clear browser cookies and try again

### Issue: "Session not persisting"
**Solution**:
- Verify cookies are being set (check browser DevTools > Application > Cookies)
- Check cookie configuration in `src/db/supabase.client.ts`
- Ensure `secure: false` for local development

### Issue: Email confirmation link doesn't work
**Solution**:
- Verify redirect URLs in Supabase dashboard
- Check that `/auth/callback` endpoint is working
- Test with "Auto Confirm User" enabled first

## Development Tools

### Browser DevTools
- **Network Tab**: Monitor API calls to `/api/auth/*`
- **Application Tab**: Check cookies (`sb-*` cookies should be present after login)
- **Console Tab**: Check for JavaScript errors

### Supabase Dashboard
- **Authentication > Users**: View all users and their status
- **Authentication > Logs**: View authentication attempts and errors
- **API Logs**: Monitor API calls

## Next Steps After Successful Testing

1. ✅ Login working
2. ⏭️ Implement registration form integration (similar to login)
3. ⏭️ Implement password reset flow
4. ⏭️ Add more comprehensive error handling
5. ⏭️ Implement rate limiting for security
6. ⏭️ Add session timeout warnings
7. ⏭️ Deploy to production

## Support & Troubleshooting

If you encounter issues:

1. Check the implementation summary: `IMPLEMENTATION_SUMMARY.md`
2. Review Supabase Auth documentation: https://supabase.com/docs/guides/auth
3. Check the console and network logs for detailed error messages
4. Verify all environment variables are correctly set
5. Ensure Supabase dashboard is properly configured

## Test User Credentials Template

For your reference, keep track of test users:

```
Test User 1:
Email: test@example.com
Password: password123
Status: Confirmed ✅

Test User 2:
Email: test2@example.com
Password: password456
Status: Pending confirmation ⏳
```

---

**Happy Testing! 🚀**

