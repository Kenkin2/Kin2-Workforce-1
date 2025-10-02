# 📱 Mobile Build Guide - Complete Setup

## 🎯 Overview

Your Kin2 Workforce platform is configured for **iOS** and **Android** mobile apps using Expo/React Native.

---

## ✅ What's Already Configured

- ✅ **app.json**: Complete Expo configuration
- ✅ **eas.json**: Build profiles for development, preview, and production
- ✅ **Native permissions**: Camera, location, photo library
- ✅ **App icons**: Configured from your existing assets
- ✅ **Build script**: `scripts/build-mobile.sh`
- ✅ **Platform detection**: Mobile-specific features ready

---

## 🚀 Quick Start (3 Steps)

### Step 1: Create Expo Account (2 minutes)

1. Go to: **https://expo.dev**
2. Click "Sign Up"
3. Create free account
4. Verify email

### Step 2: Install CLI Tools (1 minute)

```bash
npm install -g expo-cli eas-cli
```

### Step 3: Login (30 seconds)

```bash
expo login
# Enter your Expo credentials
```

---

## 🔨 Building Your Apps

### Method 1: Automated Build Script

```bash
./scripts/build-mobile.sh
```

The script will:
1. Check if you're logged in
2. Configure EAS Build
3. Ask which build type you want
4. Start the build process

### Method 2: Manual Build

```bash
# Configure EAS (first time only)
eas build:configure

# Build for both iOS and Android
eas build --platform all --profile production

# Or build separately
eas build --platform ios --profile production
eas build --platform android --profile production
```

---

## 📊 Build Profiles Explained

### Development Build
```bash
eas build --platform all --profile development
```
- **Purpose**: Testing and debugging
- **Install**: Internal testers only
- **Features**: Debug tools enabled
- **Time**: ~10-15 minutes

### Preview Build
```bash
eas build --platform all --profile preview
```
- **Purpose**: Beta testing
- **Install**: Share via link
- **iOS**: Can test on devices
- **Android**: APK file (not app bundle)
- **Time**: ~15-20 minutes

### Production Build
```bash
eas build --platform all --profile production
```
- **Purpose**: App Store submission
- **Install**: Through official stores only
- **iOS**: Requires Apple Developer account ($99/year)
- **Android**: Requires Google Play account ($25 one-time)
- **Time**: ~20-30 minutes

---

## 📲 Testing Your Apps

### Before App Store Submission

**iOS Testing:**
```bash
# Build for iOS simulator (Mac only)
eas build --platform ios --profile preview

# Or use Expo Go for quick testing
expo start --ios
```

**Android Testing:**
```bash
# Build APK for direct install
eas build --platform android --profile preview

# Or use Expo Go for quick testing
expo start --android
```

### Using Expo Go (Fastest Testing)

1. Install **Expo Go** app on your phone:
   - iOS: https://apps.apple.com/app/expo-go/id982107779
   - Android: https://play.google.com/store/apps/details?id=host.exp.exponent

2. Run development server:
```bash
expo start
```

3. Scan QR code with your phone
4. App opens in Expo Go for testing

---

## 🏪 Submitting to App Stores

### iOS App Store

**Prerequisites:**
- Apple Developer account ($99/year)
- Build completed with production profile

**Submit:**
```bash
eas submit --platform ios
```

**You'll need:**
- Apple ID
- App Store Connect API key
- App-specific password

**Review time:** 1-3 days typically

### Google Play Store

**Prerequisites:**
- Google Play Developer account ($25 one-time)
- Build completed with production profile

**Submit:**
```bash
eas submit --platform android
```

**You'll need:**
- Google Play service account JSON key
- App bundle from production build

**Review time:** Few hours to 1 day typically

---

## 📱 App Features Configured

### Camera Integration ✅
```typescript
// Already configured in app.json
NSCameraUsageDescription: "For job documentation and worker verification"
CAMERA permission (Android)
```

### Location/GPS ✅
```typescript
// Already configured in app.json
NSLocationWhenInUseUsageDescription: "For GPS-based check-in/check-out"
ACCESS_FINE_LOCATION, ACCESS_COARSE_LOCATION (Android)
```

### Photo Library ✅
```typescript
// Already configured in app.json
NSPhotoLibraryUsageDescription: "To upload documents and images"
READ_EXTERNAL_STORAGE, WRITE_EXTERNAL_STORAGE (Android)
```

### Push Notifications ✅
```typescript
// Ready to implement
// Use expo-notifications package
```

---

## 🔧 Configuration Files

### app.json
```json
{
  "expo": {
    "name": "Kin2 Workforce",
    "slug": "kin2-workforce",
    "version": "1.0.0",
    "ios": {
      "bundleIdentifier": "com.kin2.workforce",
      "buildNumber": "1.0.0"
    },
    "android": {
      "package": "com.kin2.workforce",
      "versionCode": 1
    }
  }
}
```

### eas.json
```json
{
  "build": {
    "development": { ... },
    "preview": { ... },
    "production": { ... }
  }
}
```

---

## 📊 Build Status Tracking

### Via Expo Dashboard
1. Go to: **https://expo.dev**
2. Click on your project
3. View builds in progress
4. Download completed builds

### Via CLI
```bash
eas build:list
```

### Email Notifications
You'll receive emails when:
- Build starts
- Build completes
- Build fails

---

## 🎯 Build Workflow

```
1. Code changes
   ↓
2. Update version in app.json
   ↓
3. Run: eas build --platform all --profile production
   ↓
4. Wait for build (~20-30 min)
   ↓
5. Test the build
   ↓
6. Submit: eas submit --platform all
   ↓
7. Wait for store review
   ↓
8. App published! 🎉
```

---

## 💰 Cost Breakdown

### Expo (Required)
- **Free tier**: Unlimited builds! ✅
- **Pro**: $29/month (faster builds, analytics)

### Apple (iOS Required)
- **Developer account**: $99/year
- **Required** for App Store submission

### Google (Android Required)
- **Developer account**: $25 one-time
- **Required** for Play Store submission

---

## 🆘 Troubleshooting

### Build Fails
```bash
# Check logs
eas build:list
# Click on failed build to see logs

# Common fixes:
# 1. Update app.json version
# 2. Clear cache: eas build --clear-cache
# 3. Check for dependency conflicts
```

### Can't Login to Expo
```bash
# Reset login
expo logout
expo login
```

### Build Taking Too Long
- Normal: 20-30 minutes for production
- Check status: https://status.expo.dev
- View queue: eas build:list

---

## 📚 Resources

- **Expo Docs**: https://docs.expo.dev
- **EAS Build Docs**: https://docs.expo.dev/build/introduction/
- **Submit Docs**: https://docs.expo.dev/submit/introduction/
- **Expo Dashboard**: https://expo.dev
- **Status Page**: https://status.expo.dev

---

## ✅ Checklist

Before building:
- [ ] Expo account created
- [ ] CLI tools installed (`expo-cli`, `eas-cli`)
- [ ] Logged in (`expo login`)
- [ ] Version updated in `app.json`

For production:
- [ ] Apple Developer account (iOS)
- [ ] Google Play Developer account (Android)
- [ ] App icons finalized
- [ ] App description ready
- [ ] Screenshots prepared
- [ ] Privacy policy URL (required)
- [ ] Support URL (required)

---

## 🎉 You're Ready!

Everything is configured. Just follow the 3-step quick start above and you'll have mobile apps built in minutes!

**Next**: Run `./scripts/build-mobile.sh` to start building! 🚀
