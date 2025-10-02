#!/bin/bash

echo "📱 Building Kin2 Workforce Mobile Apps..."
echo ""

# Check if Expo CLI is installed
if ! command -v expo &> /dev/null; then
  echo "📥 Installing Expo CLI..."
  npm install -g expo-cli eas-cli
fi

# Check if logged in to Expo
echo "🔐 Checking Expo authentication..."
expo whoami &> /dev/null

if [ $? -ne 0 ]; then
  echo "⚠️  You need to login to Expo first!"
  echo "Run: expo login"
  exit 1
fi

# Configure EAS
echo "⚙️  Configuring EAS Build..."
eas build:configure

# Build for both platforms
echo ""
echo "📱 Building for iOS and Android..."
echo ""
echo "Choose build option:"
echo "1) Development build (for testing)"
echo "2) Preview build (for internal distribution)"
echo "3) Production build (for app stores)"
read -p "Enter choice (1-3): " choice

case $choice in
  1)
    echo "🔨 Building development version..."
    eas build --platform all --profile development
    ;;
  2)
    echo "🔨 Building preview version..."
    eas build --platform all --profile preview
    ;;
  3)
    echo "🔨 Building production version..."
    eas build --platform all --profile production
    ;;
  *)
    echo "❌ Invalid choice!"
    exit 1
    ;;
esac

echo ""
echo "✅ Mobile build initiated!"
echo "📧 You'll receive an email when builds are complete"
echo "🔗 Visit https://expo.dev to track build progress"
