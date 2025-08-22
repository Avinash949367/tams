# Firebase Setup Guide

## Current Issue
You're getting "Missing or insufficient permissions" errors because the Firestore security rules are too restrictive for anonymous authentication.

## Quick Fix

### Option 1: Update Firestore Security Rules (Recommended)

1. Go to your Firebase Console: https://console.firebase.google.com/project/tams-78aa4
2. Navigate to **Firestore Database** → **Rules**
3. Replace the current rules with the ones from `firestore.rules` in this project
4. Click **Publish**

### Option 2: Enable Anonymous Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Anonymous** authentication
3. Click **Save**

### Option 3: Use Firebase Emulators (For Development)

If you want to use local emulators instead:

1. Install Firebase CLI: `npm install -g firebase-tools`
2. Login: `firebase login`
3. Initialize: `firebase init emulators`
4. Start emulators: `firebase emulators:start`
5. Uncomment the emulator connection code in `src/lib/firebase.ts`

## Testing the Fix

After updating the security rules:

1. Refresh your admin page
2. Try clicking "Start Roll" - it should work now
3. Check the browser console - permission errors should be gone

## Security Notes

- The current rules allow any authenticated user to read/write all data
- For production, use the more restrictive rules commented in `firestore.rules`
- Consider implementing proper user roles and permissions

## Troubleshooting

If you still get permission errors:

1. Check that Anonymous Authentication is enabled
2. Verify the security rules are published
3. Clear browser cache and refresh
4. Check Firebase Console for any error messages
