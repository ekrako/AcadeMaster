#!/bin/bash

# Script to add Firebase Service Account JSON to GitHub repository secrets
# Usage: ./add-service-account-secret.sh path/to/service-account-key.json

echo "🔑 Setting up Firebase Service Account for GitHub Actions..."

# Check if JSON file path is provided
if [ $# -eq 0 ]; then
    echo "❌ Error: Please provide the path to your service account JSON file"
    echo ""
    echo "Usage: $0 path/to/service-account-key.json"
    echo ""
    echo "📋 To get the service account JSON file:"
    echo "   1. Go to: https://console.firebase.google.com/project/academaster-1/settings/serviceaccounts/adminsdk"
    echo "   2. Click 'Generate new private key'"
    echo "   3. Download the JSON file"
    echo "   4. Run this script with the path to that file"
    exit 1
fi

SERVICE_ACCOUNT_FILE="$1"

# Check if file exists
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "❌ Error: File '$SERVICE_ACCOUNT_FILE' not found"
    exit 1
fi

# Check if file is valid JSON
if ! jq empty "$SERVICE_ACCOUNT_FILE" 2>/dev/null; then
    echo "❌ Error: '$SERVICE_ACCOUNT_FILE' is not valid JSON"
    echo "Please make sure you downloaded the correct service account key file"
    exit 1
fi

# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh"
    echo "   or visit: https://cli.github.com/"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"

# Validate the service account JSON structure
PROJECT_ID=$(jq -r '.project_id' "$SERVICE_ACCOUNT_FILE" 2>/dev/null)
if [ "$PROJECT_ID" != "academaster-1" ]; then
    echo "⚠️  Warning: Service account project_id is '$PROJECT_ID', expected 'academaster-1'"
    echo "   Make sure you downloaded the key from the correct Firebase project"
    read -p "   Continue anyway? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "❌ Aborted"
        exit 1
    fi
fi

# Add the service account JSON as a GitHub secret
echo "📤 Adding service account JSON to GitHub secrets..."
if gh secret set GOOGLE_APPLICATION_CREDENTIALS_JSON < "$SERVICE_ACCOUNT_FILE"; then
    echo "✅ Successfully added GOOGLE_APPLICATION_CREDENTIALS_JSON secret"
else
    echo "❌ Failed to add secret"
    exit 1
fi

# Verify the secret was added
echo "🔍 Verifying secret was added..."
if gh secret list | grep -q "GOOGLE_APPLICATION_CREDENTIALS_JSON"; then
    echo "✅ Secret verified in GitHub repository"
else
    echo "⚠️  Warning: Could not verify secret was added"
fi

echo ""
echo "🎉 Service account setup completed!"
echo ""
echo "📋 What happens next:"
echo "   ✅ GitHub Actions will use service account authentication"
echo "   ✅ No more deprecation warnings about --token usage"
echo "   ✅ More secure and future-proof authentication"
echo ""
echo "🧪 Test the setup:"
echo "   1. Go to: https://github.com/ekrako/AcadeMaster/actions"
echo "   2. Select 'Manual Deploy to Firebase Hosting'"
echo "   3. Click 'Run workflow' and deploy to preview"
echo "   4. Check logs - should show 'Using service account authentication'"
echo ""
echo "🔒 Security reminder:"
echo "   🗑️  Delete the service account JSON file: rm '$SERVICE_ACCOUNT_FILE'"
echo "   🔐 The secret is now safely stored in GitHub and the local file is no longer needed"

# Offer to delete the file
echo ""
read -p "🗑️  Delete the local service account file now? (Y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Nn]$ ]]; then
    echo "⚠️  Remember to delete '$SERVICE_ACCOUNT_FILE' manually for security"
else
    if rm "$SERVICE_ACCOUNT_FILE"; then
        echo "✅ Service account file deleted"
    else
        echo "⚠️  Could not delete file. Please remove manually: rm '$SERVICE_ACCOUNT_FILE'"
    fi
fi

echo ""
echo "🚀 Your Firebase deployment workflows are now ready with service account authentication!"