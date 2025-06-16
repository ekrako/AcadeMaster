#!/bin/bash

# Script to test Firebase deployment authentication methods
# This helps verify which authentication method will be used

echo "🔍 Testing Firebase deployment authentication setup..."
echo ""

# Check if gh CLI is available
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) not available - cannot check secrets"
    echo "   Install with: brew install gh"
    exit 1
fi

if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI"
    echo "   Run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is authenticated"
echo ""

# Check GitHub secrets
echo "🔑 Checking GitHub repository secrets..."

if gh secret list | grep -q "GOOGLE_APPLICATION_CREDENTIALS_JSON"; then
    echo "✅ GOOGLE_APPLICATION_CREDENTIALS_JSON - Found (Preferred method)"
    SERVICE_ACCOUNT_AVAILABLE=true
else
    echo "❌ GOOGLE_APPLICATION_CREDENTIALS_JSON - Not found"
    SERVICE_ACCOUNT_AVAILABLE=false
fi

if gh secret list | grep -q "FIREBASE_TOKEN"; then
    echo "⚠️  FIREBASE_TOKEN - Found (Deprecated method)"
    TOKEN_AVAILABLE=true
else
    echo "❌ FIREBASE_TOKEN - Not found"
    TOKEN_AVAILABLE=false
fi

echo ""

# Determine which authentication method will be used
echo "🎯 Authentication method that will be used in GitHub Actions:"

if [ "$SERVICE_ACCOUNT_AVAILABLE" = true ]; then
    echo "✅ Service Account Authentication (Recommended)"
    echo "   • No deprecation warnings"
    echo "   • Future-proof"
    echo "   • More secure"
elif [ "$TOKEN_AVAILABLE" = true ]; then
    echo "⚠️  Token Authentication (Deprecated)"
    echo "   • Will show deprecation warnings"
    echo "   • Still works but not recommended"
    echo "   • Should migrate to service account"
else
    echo "❌ No Authentication Available"
    echo "   • Deployments will fail"
    echo "   • Need to set up either service account or token"
fi

echo ""

# Provide next steps
if [ "$SERVICE_ACCOUNT_AVAILABLE" = false ]; then
    echo "📋 To set up service account authentication:"
    echo "   1. Download service account key from Firebase Console:"
    echo "      https://console.firebase.google.com/project/academaster-1/settings/serviceaccounts/adminsdk"
    echo "   2. Run: ./add-service-account-secret.sh path/to/downloaded-key.json"
    echo ""
fi

if [ "$TOKEN_AVAILABLE" = false ] && [ "$SERVICE_ACCOUNT_AVAILABLE" = false ]; then
    echo "📋 Or to use token authentication (temporary):"
    echo "   1. Run: firebase login:ci"
    echo "   2. Run: gh secret set FIREBASE_TOKEN --body 'your-token-here'"
    echo ""
fi

# Show current Firebase project
echo "📋 Current Firebase project configuration:"
if command -v firebase &> /dev/null; then
    firebase use
else
    echo "   Firebase CLI not available"
fi

echo ""
echo "🧪 To test the setup:"
echo "   • Go to: https://github.com/ekrako/AcadeMaster/actions"
echo "   • Run 'Manual Deploy to Firebase Hosting' workflow"
echo "   • Check logs for authentication method used"