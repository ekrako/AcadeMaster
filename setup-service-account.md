# Setting up Firebase Service Account for GitHub Actions

This guide will help you set up the `GOOGLE_APPLICATION_CREDENTIALS_JSON` secret to replace the deprecated Firebase token authentication.

## 🔧 Step 1: Generate Service Account Key

### Option A: Via Firebase Console (Recommended)
1. Go to [Firebase Console](https://console.firebase.google.com/project/academaster-1/settings/serviceaccounts/adminsdk)
2. Click on **"Generate new private key"**
3. Click **"Generate key"** in the confirmation dialog
4. A JSON file will be downloaded - **keep this file secure!**

### Option B: Via Google Cloud Console
1. Go to [Google Cloud Console](https://console.cloud.google.com/iam-admin/serviceaccounts?project=academaster-1)
2. Find the Firebase Admin SDK service account (looks like `firebase-adminsdk-xxxxx@academaster-1.iam.gserviceaccount.com`)
3. Click the **Actions** menu (three dots) → **Manage keys**
4. Click **Add Key** → **Create new key**
5. Select **JSON** format and click **Create**

## 🔧 Step 2: Add to GitHub Secrets

### Option A: Manual (GitHub Web Interface)
1. Go to your repository: https://github.com/ekrako/AcadeMaster
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **"New repository secret"**
4. Name: `GOOGLE_APPLICATION_CREDENTIALS_JSON`
5. Value: Copy the **entire contents** of the downloaded JSON file
6. Click **"Add secret"**

### Option B: Using GitHub CLI (After downloading the key)
```bash
# Replace 'path/to/your/service-account-key.json' with the actual path
gh secret set GOOGLE_APPLICATION_CREDENTIALS_JSON < path/to/your/service-account-key.json
```

## 🔧 Step 3: Required Permissions

The service account needs these permissions (usually already configured for Firebase Admin SDK):
- **Firebase Hosting Admin**: For deploying to hosting
- **Service Account User**: For authentication
- **Firebase Admin**: For full Firebase access

## 🔧 Step 4: Verify Setup

After adding the secret, you can verify it's working by:

1. **Manual Deployment Test**:
   - Go to **Actions** tab in your repository
   - Select **"Manual Deploy to Firebase Hosting"**
   - Click **"Run workflow"** and deploy to preview

2. **Check Logs**:
   - The workflow should show "Using service account authentication" instead of the deprecation warning

## ✅ Benefits

After setup, you'll get:
- ✅ **No deprecation warnings**
- ✅ **Future-proof authentication**
- ✅ **Better security** (service accounts are more secure than tokens)
- ✅ **Granular permissions** (can be restricted to specific Firebase services)

## 🔒 Security Notes

- **Never commit** the service account JSON file to your repository
- **Keep the downloaded file secure** and delete it after adding to GitHub secrets
- **Regularly rotate** service account keys (every 90 days recommended)
- **Use least privilege** principle - only grant necessary permissions

## 🆘 Troubleshooting

### Service Account Not Found
If you don't see a Firebase Admin SDK service account:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Click **"Generate new private key"** - this will create one if it doesn't exist

### Permission Denied Errors
If deployment fails with permission errors:
1. Verify the service account has **Firebase Hosting Admin** role
2. Check that the project ID in the workflow matches your Firebase project

### Invalid JSON Format
Make sure you're copying the **entire JSON file content**, including the curly braces `{ }`.

## 📞 Need Help?

If you encounter issues:
1. Check the GitHub Actions logs for specific error messages
2. Verify the secret was added correctly in GitHub repository settings
3. Ensure the service account has the required permissions in Firebase Console