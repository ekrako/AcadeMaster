#!/bin/bash

# Script to add Firebase configuration secrets to GitHub repository
# Make sure you have GitHub CLI (gh) installed and authenticated

echo "🔑 Adding Firebase configuration secrets to GitHub repository..."

# Check if gh CLI is installed and authenticated
if ! command -v gh &> /dev/null; then
    echo "❌ GitHub CLI (gh) is not installed. Please install it first:"
    echo "   brew install gh"
    echo "   or visit: https://cli.github.com/"
    exit 1
fi

# Check if authenticated
if ! gh auth status &> /dev/null; then
    echo "❌ Not authenticated with GitHub CLI. Please run: gh auth login"
    exit 1
fi

echo "✅ GitHub CLI is installed and authenticated"

# Add Firebase configuration secrets
echo "Adding NEXT_PUBLIC_FIREBASE_API_KEY..."
gh secret set NEXT_PUBLIC_FIREBASE_API_KEY --body "AIzaSyAlDryAVcnj6x4vwexXaX8m1CRro5fBmUU"

echo "Adding NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN..."
gh secret set NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN --body "academaster-1.firebaseapp.com"

echo "Adding NEXT_PUBLIC_FIREBASE_PROJECT_ID..."
gh secret set NEXT_PUBLIC_FIREBASE_PROJECT_ID --body "academaster-1"

echo "Adding NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET..."
gh secret set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET --body "academaster-1.firebasestorage.app"

echo "Adding NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID..."
gh secret set NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --body "498616340571"

echo "Adding NEXT_PUBLIC_FIREBASE_APP_ID..."
gh secret set NEXT_PUBLIC_FIREBASE_APP_ID --body "1:498616340571:web:77f07bebbbf2f46af4ef7e"

echo "Adding NEXT_PUBLIC_FIREBASE_DATABASE_URL..."
gh secret set NEXT_PUBLIC_FIREBASE_DATABASE_URL --body "https://academaster-1-default-rtdb.firebaseio.com"

echo ""
echo "🎉 All Firebase configuration secrets have been added successfully!"
echo ""
echo "📋 Secrets added:"
echo "   ✅ NEXT_PUBLIC_FIREBASE_API_KEY"
echo "   ✅ NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
echo "   ✅ NEXT_PUBLIC_FIREBASE_PROJECT_ID"
echo "   ✅ NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
echo "   ✅ NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
echo "   ✅ NEXT_PUBLIC_FIREBASE_APP_ID"
echo "   ✅ NEXT_PUBLIC_FIREBASE_DATABASE_URL"
echo ""
echo "🚀 The next GitHub Actions run will now have access to Firebase configuration."
echo "   You can trigger a new deployment by pushing to master or manually running the workflow."
echo ""
echo "🔍 To view all secrets: gh secret list"
echo "🌐 Monitor deployment: https://github.com/ekrako/AcadeMaster/actions"