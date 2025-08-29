# Authentication System

## Overview

The Camp Teams application now features a streamlined authentication system that takes users directly to the login/signup page, with comprehensive password reset functionality.

## Features

### Direct Login Access
- **No Landing Page**: Users are taken directly to the authentication page when they visit the app
- **Clean UX**: Eliminates the countdown landing page for a more direct user experience

### Authentication Modes
1. **Sign In**: For existing users to access their account
2. **Sign Up**: For new users to create an account
3. **Forgot Password**: For users who need to reset their password

### Password Reset Flow
1. **Request Reset**: User clicks "Forgot your password?" on the sign-in page
2. **Email Sent**: System sends a password reset link to the user's email
3. **Reset Link**: User clicks the link in their email
4. **New Password**: User enters and confirms their new password
5. **Success**: User is redirected back to sign-in with their new password

## Technical Implementation

### Components
- `Auth.tsx`: Main authentication component with three modes
- `PasswordReset.tsx`: Dedicated password reset component
- `useAuth.ts`: Authentication hook with password reset methods

### Supabase Integration
- Uses Supabase Auth for all authentication operations
- Password reset emails are sent via Supabase
- Secure token-based password reset flow
- Proper redirect URL handling for email links

### Security Features
- Rate limiting on email sending
- Strong password requirements (8+ chars, uppercase, lowercase, number)
- Secure token validation
- Automatic session management

## User Flow

### New User
1. Visit app → Direct to Auth page
2. Click "Don't have an account? Sign up"
3. Enter email and password
4. Confirm email via link
5. Sign in with credentials

### Existing User
1. Visit app → Direct to Auth page
2. Enter email and password
3. Access dashboard

### Password Reset
1. On sign-in page → Click "Forgot your password?"
2. Enter email address
3. Check email for reset link
4. Click link → Password reset page
5. Enter new password
6. Return to sign-in with new password

## Configuration

### Environment Variables
- `VITE_SITE_URL`: Base URL for email redirects (optional, defaults to window.location.origin)

### Supabase Setup
- Ensure password reset is enabled in Supabase Auth settings
- Configure email templates in Supabase dashboard
- Set up proper redirect URLs in Supabase Auth settings

## Error Handling

- **Rate Limiting**: Users are informed when they hit email sending limits
- **Validation**: Real-time form validation with helpful error messages
- **Network Errors**: Graceful handling of connection issues
- **Invalid Tokens**: Clear messaging for expired or invalid reset links

## Accessibility

- Keyboard navigation support
- Screen reader friendly
- High contrast mode support
- Clear error messaging
- Loading states for all operations
