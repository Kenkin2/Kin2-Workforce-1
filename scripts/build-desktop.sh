#!/bin/bash

echo "🖥️  Building Kin2 Workforce Desktop Apps..."
echo ""

# Build web app first
echo "📦 Step 1/4: Building web application..."
npm run build

if [ $? -ne 0 ]; then
  echo "❌ Web build failed!"
  exit 1
fi

echo "✅ Web build complete!"
echo ""

# Install Electron dependencies if needed
if [ ! -d "node_modules/electron" ]; then
  echo "📥 Installing Electron dependencies..."
  npm install electron electron-builder concurrently
fi

# Build desktop apps
echo "🔨 Step 2/4: Building desktop applications..."
echo ""

# Detect platform and build accordingly
case "$(uname -s)" in
  Darwin*)
    echo "🍎 macOS detected - Building for Mac..."
    npx electron-builder --mac
    ;;
  Linux*)
    echo "🐧 Linux detected - Building for Linux..."
    npx electron-builder --linux
    ;;
  MINGW*|MSYS*|CYGWIN*)
    echo "🪟 Windows detected - Building for Windows..."
    npx electron-builder --win
    ;;
  *)
    echo "❓ Unknown platform - Building for all platforms..."
    npx electron-builder -mwl
    ;;
esac

echo ""
echo "✅ Desktop build complete!"
echo "📁 Build files are in the 'release' directory"
echo ""
echo "🎉 Kin2 Workforce Desktop App is ready!"
