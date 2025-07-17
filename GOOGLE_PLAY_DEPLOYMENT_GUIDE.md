# Google Play Deployment Guide

## Table of Contents
1. [App Signing and Release Keystore Generation](#1-app-signing-and-release-keystore-generation)
2. [Google Play Console Setup](#2-google-play-console-setup)
3. [In-App Purchase & Subscription Configuration](#3-in-app-purchase--subscription-configuration)
4. [Internal Testing Setup](#4-internal-testing-setup)
5. [Production Release Process](#5-production-release-process)
6. [Common Issues & Troubleshooting](#6-common-issues--troubleshooting)

---

## 1. App Signing and Release Keystore Generation

### 1.1 Generate a Release Keystore

#### Using Android Studio (Recommended)
1. Open Android project in Android Studio
2. Navigate to Build > Generate Signed Bundle/APK
3. Select "Android App Bundle" or "APK"
4. Click "Create new..." button
5. Fill in the key store information:
   - Key store path (e.g., `aspiring-release-key.keystore`)
   - Password (at least 6 characters)
   - Alias (e.g., "upload")
   - Key password (can be same as keystore password)
   - Validity (25 years recommended - 10000 days)
   - Certificate information (Name, Organization, etc.)
6. Click "OK" to generate key store

#### Using Command Line
```bash
keytool -genkeypair -v -keystore aspiring-release-key.keystore -alias upload -keyalg RSA -keysize 2048 -validity 10000
```
Follow the prompts to enter:
- Password (Remember this!)
- First and Last name
- Organizational unit
- Organization name
- City or Locality
- State or Province
- Country code

### 1.2 Secure Your Keystore
- Store in a secure location
- Create a backup in a separate location
- Add to `.gitignore` to prevent accidental commits
- Document the password securely (not in the repository)

### 1.3 Configure Gradle for Signing

Add to `android/app/build.gradle`:
```gradle
android {
    // ...existing code...
    
    signingConfigs {
        release {
            storeFile file("../aspiring-release-key.keystore")
            storePassword "your-store-password"
            keyAlias "upload"
            keyPassword "your-key-password"
        }
    }
    
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

For better security, use environment variables or gradle.properties:
```gradle
// In gradle.properties (add to .gitignore)
RELEASE_STORE_PASSWORD=your-store-password
RELEASE_KEY_PASSWORD=your-key-password

// In build.gradle
signingConfigs {
    release {
        storeFile file("../aspiring-release-key.keystore")
        storePassword RELEASE_STORE_PASSWORD
        keyAlias "upload"
        keyPassword RELEASE_KEY_PASSWORD
    }
}
```

### 1.4 Generate a Signed Build

#### Using Android Studio
1. Build your app with Ionic/Capacitor:
   ```bash
   ionic build --prod
   npx cap copy android
   npx cap open android
   ```
   
2. In Android Studio:
   - Navigate to Build > Generate Signed Bundle/APK
   - Select Android App Bundle (preferred) or APK
   - Select your keystore and enter passwords
   - Choose release build type
   - Select destination folder
   - Click "Finish"

#### Using Command Line
```bash
cd android
./gradlew bundleRelease   # For App Bundle (preferred)
# or
./gradlew assembleRelease # For APK
```

3. Locate the output file:
   - For App Bundle: `android/app/build/outputs/bundle/release/app-release.aab`
   - For APK: `android/app/build/outputs/apk/release/app-release.apk`

---

## 2. Google Play Console Setup

### 2.1 Create a Developer Account
1. Visit Google Play Console: https://play.google.com/console
2. Sign in with a Google Account
3. Pay the registration fee ($25 one-time)
4. Complete the registration process:
   - Account details
   - Developer agreement
   - Payment information

### 2.2 Create a New Application
1. Click "Create app"
2. Fill in basic information:
   - App name: "Government Billing Solution"
   - Default language: English
   - App or Game: App
   - Free or Paid: Free (with in-app purchases)
   - Declaration compliance

### 2.3 Complete Required Information
1. **Store Listing:**
   - Short description (80 chars max)
   - Full description (4000 chars max)
   - Graphics:
     * App icon (512x512 PNG)
     * Feature graphic (1024x500 PNG)
     * Phone screenshots (minimum 2)
     * Tablet screenshots (if supporting tablets)
   - Categorization and contact details
   - Privacy Policy URL (required for apps with in-app purchases)

2. **Content Rating:**
   - Complete the rating questionnaire
   - Expected rating: PEGI 3 / Everyone

3. **App Release Section:**
   - Create release in internal testing track
   - Upload your signed AAB/APK
   - Add release notes

4. **Price & Distribution:**
   - Select free app
   - Choose distribution countries
   - Select content guidelines compliance

---

## 3. In-App Purchase & Subscription Configuration

### 3.1 Enable In-App Purchases
1. Go to "Monetization setup" in the left menu
2. Enable "In-app products"
3. Complete tax information form:
   - Business structure
   - Tax identity information
   - Payment profile
4. Set up a Google Payment merchant account

### 3.2 Configure In-App Products
1. Go to "Monetize > In-app products" 
2. Click "Create product"
3. Add each consumable product:

   **PDF Packages:**
   ```
   Product ID: 2014inv10Pdf
   Name: 10 PDF Package
   Description: Generate and share up to 10 PDF documents
   Price: $0.99
   
   Product ID: 2014inv25Pdf
   Name: 25 PDF Package
   Description: Generate and share up to 25 PDF documents
   Price: $1.99
   
   Product ID: 2014inv50Pdf
   Name: 50 PDF Package
   Description: Generate and share up to 50 PDF documents
   Price: $2.99
   
   Product ID: 2014inv100Pdf
   Name: 100 PDF Package
   Description: Generate and share up to 100 PDF documents
   Price: $3.99
   ```

   **Sharing Packages:**
   ```
   Product ID: 2015inv10fb
   Name: Facebook Sharing Package
   Description: Share 10 documents via Facebook
   Price: $0.99
   
   Product ID: 2015inv10tw
   Name: Twitter Sharing Package
   Description: Share 10 documents via Twitter
   Price: $0.99
   
   Product ID: 2015inv10wa
   Name: WhatsApp Sharing Package
   Description: Share 10 documents via WhatsApp
   Price: $0.99
   
   Product ID: 2015inv10sms
   Name: SMS Sharing Package
   Description: Share 10 documents via SMS
   Price: $0.99
   ```

   **Email/Print/Save Packages:**
   ```
   Product ID: 2015invSavePrintEmail
   Name: Basic SPE Package
   Description: 10 Save, Print, and Email operations
   Price: $0.99
   
   Product ID: 2015inv500SavePrintEmail
   Name: Business SPE Package
   Description: 500 Save, Print, and Email operations
   Price: $3.99
   
   Product ID: 2015inv1000SavePrintEmail
   Name: Enterprise SPE Package
   Description: 1000 Save, Print, and Email operations
   Price: $6.99
   ```

### 3.3 Configure Subscription Products
1. Go to "Monetize > Subscriptions" 
2. Click "Create subscription"
3. Add each subscription product:

   **Monthly Subscription:**
   ```
   Product ID: gov_billing_subscription_monthly
   Name: Monthly Premium Subscription
   Description: Unlimited access to all premium features for one month
   Base Plan:
     - Billing period: Monthly
     - Price: $4.99
     - Free trial: Optional (7 days recommended)
     - Grace period: 3 days (recommended)
     - Auto-renewing: Yes
   ```

   **Annual Subscription:**
   ```
   Product ID: gov_billing_subscription_yearly
   Name: Annual Premium Subscription
   Description: Unlimited access to all premium features for one year (33% savings)
   Base Plan:
     - Billing period: Annual
     - Price: $39.99
     - Free trial: Optional (7 days recommended)
     - Grace period: 3 days (recommended)
     - Auto-renewing: Yes
   ```

---

## 4. Internal Testing Setup

### 4.1 Create Internal Testing Track
1. Go to "Testing > Internal testing"
2. Click "Create new release"
3. Upload your signed app bundle/APK
4. Add release notes: "Initial release with in-app purchases and subscriptions"
5. Save and review the release

### 4.2 Add Test Users
1. Click "Manage testers"
2. Create an email list (e.g., "Core Testers")
3. Add team members' Gmail addresses
4. Click "Save" and then "Add testers"

### 4.3 Set Up License Testing
1. Go to "Setup > License Testing"
2. Add the same Gmail accounts
3. Set response to "Licensed"
4. Click "Save changes"

### 4.4 Start Internal Testing
1. Return to your internal testing release
2. Click "Review release"
3. Click "Start rollout to Internal testing"
4. Share the opt-in URL with your testers

### 4.5 Test Purchase Flow
1. Have testers install the app from the opt-in URL
2. Test all product purchases:
   - One-time purchases
   - Monthly subscription
   - Yearly subscription
3. Verify purchases appear correctly
4. Test cancellation flows
5. Test restoration of purchases

---

## 5. Production Release Process

### 5.1 Pre-Launch Checklist
- App functionality fully tested
- All in-app purchases working correctly
- Subscriptions working correctly
- UI/UX polished and responsive
- Store listing complete with quality graphics
- Privacy policy compliant and accessible
- Content rating questionnaire completed

### 5.2 Production Release
1. Go to "Production" track
2. Create new release
3. Upload final app bundle
4. Add detailed release notes
5. Consider phased rollout (start with 10-20%)
6. Click "Review release"
7. Start rollout to Production

### 5.3 Post-Launch Verification
1. Download the published app
2. Make a real test purchase (small amount)
3. Verify the purchase works correctly
4. Request refund if needed for testing

---

## 6. Common Issues & Troubleshooting

### 6.1 Signing Issues
- **Problem**: App signature doesn't match Google Play
- **Solution**: Use Google Play App Signing and upload your upload key

- **Problem**: Lost keystore file
- **Solution**: If enrolled in Play App Signing, contact Google support. Otherwise, you'll need to create a new app listing.

### 6.2 In-App Purchase Problems
- **Problem**: Products not showing in the app
- **Solution**: 
  * Ensure product IDs match exactly in code and Play Console
  * Wait 2+ hours after creating products in the console
  * Check the app is using a test account
  * Verify app is signed properly

- **Problem**: Test purchases failing
- **Solution**:
  * Verify test account is properly set up in license testing
  * Check internet connectivity
  * Update Google Play Services on test device
  * Clear Google Play Store cache and data

### 6.3 Subscription Issues
- **Problem**: Subscription not recognized after purchase
- **Solution**:
  * Implement proper receipt validation
  * Check subscription status APIs
  * Verify proper subscription token handling

- **Problem**: Renewals not working
- **Solution**:
  * Verify billing permission in AndroidManifest.xml
  * Check for payment issues in tester accounts
  * Implement proper renewal handling in code

### 6.4 Play Console Rejection Issues
- **Problem**: App rejected during review
- **Solution**:
  * Read rejection reason carefully
  * Address all mentioned policy violations
  * Make necessary changes and resubmit
  * Include detailed explanation in the submission notes

---

## Important Resources

- Google Play Console: https://play.google.com/console
- Play Console Help: https://support.google.com/googleplay/android-developer
- Google Play Billing Library: https://developer.android.com/google/play/billing
- Testing In-App Purchases: https://developer.android.com/google/play/billing/test
