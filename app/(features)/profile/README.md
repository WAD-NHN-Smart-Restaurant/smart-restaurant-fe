# Customer Profile Feature

This document describes the implementation of the customer profile feature for the smart-restaurant frontend.

## Overview

The profile feature allows authenticated customers to:

- View their profile information
- Update their full name
- Upload/update/remove profile avatar
- Change their password (with current password verification)
- Update their email address (with email confirmation)
- Update their phone number (with SMS verification)

## Implementation Details

### Authentication

All profile updates use Supabase Auth's `updateUser()` method directly from the browser. This ensures:

- Proper session handling
- Built-in verification flows for email and phone changes
- Secure password updates

### Session Management

The implementation uses the session from cookies (set during login) to authenticate API calls:

- Access token and refresh token are stored in HTTP-only cookies
- Supabase client automatically uses these tokens for authenticated requests
- No manual token passing required

### File Structure

```
app/(features)/profile/
├── page.tsx                          # Profile page entry
├── _contents/
│   └── content.tsx                   # Main profile content with auth guard
└── _components/
    ├── profile-header.tsx            # User avatar and logout button
    ├── profile-info.tsx              # Display account information
    ├── update-name-form.tsx          # Update full name
    ├── update-avatar-form.tsx        # Upload/update/remove avatar
    ├── update-password-form.tsx      # Change password with verification
    ├── update-email-form.tsx         # Update email with confirmation
    └── update-phone-form.tsx         # Update phone with SMS verification
```

### Features

#### 1. Update Name

- Updates user metadata via `supabase.auth.updateUser({ data: { full_name } })`
- Input validation with max 100 characters
- Instant feedback with success/error messages

#### 2. Update Avatar

- Uploads images to Supabase Storage bucket `customer-avatars`
- Supports JPG, PNG, and WebP formats
- Maximum file size: 5MB
- Image preview before upload
- Stores avatar URL in user metadata
- Option to remove current avatar

#### 3. Update Password

- Requires current password verification
- Validates password match for new password
- Uses `supabase.auth.updateUser({ password })`
- Shows/hides password fields with eye icon

#### 4. Update Email

- Uses `supabase.auth.updateUser({ email })`
- Sends confirmation emails to both old and new addresses
- User must confirm via email link to complete change

#### 5. Update Phone Number

- Uses `supabase.auth.updateUser({ phone })`
- Validates E.164 format (e.g., +1234567890)
- Sends SMS verification code
- User must enter code to complete change

### Dependencies

- `@supabase/supabase-js` - Supabase client for auth operations
- `@radix-ui/react-avatar` - Avatar component
- `react-hook-form` - Form handling
- `zod` - Schema validation
- `@hookform/resolvers/zod` - React Hook Form + Zod integration

### Navigation

The bottom navigation bar has been updated to link to `/profile` instead of `/login` for the Profile tab.

## Usage

1. **Prerequisites**: User must be authenticated (logged in)
2. **Access**: Navigate to `/profile` or click the Profile tab in bottom navigation
3. **Auth Guard**: Redirects to login if not authenticated
4. **Updates**: All changes are reflected immediately in the UI after successful update

## Security Considerations

- Password updates require current password verification
- Email changes require confirmation from both old and new addresses
- Phone changes require SMS verification code
- Avatar uploads are validated for file type and size
- All operations use Supabase's built-in security features
- User metadata updates are properly scoped to authenticated user

## Error Handling

- Form validation errors displayed inline
- API errors shown in alert components
- Network errors handled gracefully
- Success messages auto-dismiss after 3-5 seconds

## Backend Integration

The frontend communicates with Supabase Auth directly for:

- User metadata updates (name, avatar URL)
- Password changes
- Email updates
- Phone number updates

Avatar images are stored in Supabase Storage and can be accessed via public URLs.
