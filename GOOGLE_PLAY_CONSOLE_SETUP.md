# Google Play Console Setup Guide for In-App Purchases & Subscriptions

## 📋 Overview
This guide will help you set up Google Play Console for the Government Billing Solution MVP app to enable in-app purchases and subscriptions on Android devices.

## 🚀 Prerequisites
- Google Play Console Developer Account ($25 one-time fee)
- Signed APK/AAB file of your app
- App uploaded to Google Play Console

---

## 📱 Step 1: App Setup in Google Play Console

### 1.1 Create App (if not already created)
1. Go to [Google Play Console](https://play.google.com/console)
2. Click **"Create app"**
3. Fill in app details:
   - **App name**: `Government Billing Solution`
   - **Default language**: `English (United States)`
   - **App or game**: `App`
   - **Free or paid**: `Free`
   - **Declaration**: Check all boxes
4. Click **"Create app"**

### 1.2 Upload App Bundle/APK
1. Go to **"Release" → "Production"**
2. Click **"Create new release"**
3. Upload your signed APK/AAB file
4. Complete release details and publish

---

## 💰 Step 2: In-App Products Setup

### 2.1 Navigate to In-App Products
1. In Google Play Console, go to **"Monetize" → "Products" → "In-app products"**
2. Click **"Create product"**

### 2.2 Create PDF Package Products

#### Product 1: PDF 5 Credits
- **Product ID**: `2014inv10Pdf`
- **Name**: `PDF Package - 5 Credits`
- **Description**: `Generate 5 PDF documents from your invoices`
- **Status**: `Active`
- **Price**: `$0.99 USD`

#### Product 2: PDF 15 Credits  
- **Product ID**: `2014inv25Pdf`
- **Name**: `PDF Package - 15 Credits`
- **Description**: `Generate 15 PDF documents from your invoices`
- **Status**: `Active`
- **Price**: `$1.99 USD`

#### Product 3: PDF 35 Credits
- **Product ID**: `2014inv50Pdf`
- **Name**: `PDF Package - 35 Credits`
- **Description**: `Generate 35 PDF documents from your invoices`
- **Status**: `Active`
- **Price**: `$2.99 USD`

#### Product 4: PDF 100 Credits
- **Product ID**: `2014inv100Pdf`
- **Name**: `PDF Package - 100 Credits`
- **Description**: `Generate 100 PDF documents from your invoices`
- **Status**: `Active`
- **Price**: `$3.99 USD`

### 2.3 Create Social Sharing Products

#### Facebook Sharing
- **Product ID**: `2015inv10fb`
- **Name**: `Facebook Share - 10 Credits`
- **Description**: `Share 10 invoices on Facebook`
- **Status**: `Active`
- **Price**: `$0.99 USD`

#### Twitter Sharing
- **Product ID**: `2015inv10tw`
- **Name**: `Twitter Share - 10 Credits`
- **Description**: `Share 10 invoices on Twitter`
- **Status**: `Active`
- **Price**: `$0.99 USD`

#### WhatsApp Sharing
- **Product ID**: `2015inv10wa`
- **Name**: `WhatsApp Share - 10 Credits`
- **Description**: `Share 10 invoices on WhatsApp`
- **Status**: `Active`
- **Price**: `$0.99 USD`

#### SMS Sharing
- **Product ID**: `2015inv10sms`
- **Name**: `SMS Share - 10 Credits`
- **Description**: `Share 10 invoices via SMS`
- **Status**: `Active`
- **Price**: `$0.99 USD`

### 2.4 Create Email/Print/Save Products

#### Basic Package
- **Product ID**: `2015invSavePrintEmail`
- **Name**: `Email/Print/Save - 10 Credits`
- **Description**: `Email, print, or save 10 invoices`
- **Status**: `Active`
- **Price**: `$0.99 USD`

#### Standard Package
- **Product ID**: `2015inv500SavePrintEmail`
- **Name**: `Email/Print/Save - 500 Credits`
- **Description**: `Email, print, or save 500 invoices`
- **Status**: `Active`
- **Price**: `$3.99 USD`

#### Premium Package
- **Product ID**: `2015inv1000SavePrintEmail`
- **Name**: `Email/Print/Save - 1000 Credits`
- **Description**: `Email, print, or save 1000 invoices`
- **Status**: `Active`
- **Price**: `$6.99 USD`

### 2.5 Create Additional Products

#### Save to Device
- **Product ID**: `2015inv10save`
- **Name**: `Save to Device - 10 Credits`
- **Description**: `Save 10 invoices to device storage`
- **Status**: `Active`
- **Price**: `$0.99 USD`

#### Cloud Save
- **Product ID**: `2015invCloud`
- **Name**: `Cloud Save - 5 Credits`
- **Description**: `Save 5 invoices to cloud storage`
- **Status**: `Active`
- **Price**: `$1.99 USD`

---

## 📅 Step 3: Subscription Setup

### 3.1 Navigate to Subscriptions
1. Go to **"Monetize" → "Products" → "Subscriptions"**
2. Click **"Create subscription"**

### 3.2 Create Monthly Subscription

#### Basic Information
- **Subscription ID**: `gov_billing_subscription_monthly`
- **Name**: `Monthly Premium Plan`
- **Description**: `Unlimited access to all premium features for 30 days`

#### Pricing
- **Price**: `$4.99 USD`
- **Billing period**: `1 month`
- **Free trial**: `7 days` (optional)

#### Benefits
Add these benefits in description:
```
✓ UNLIMITED PDF generation
✓ UNLIMITED Print access
✓ UNLIMITED Email sharing
✓ UNLIMITED Save to device
✓ UNLIMITED Social media sharing
✓ Cloud backup included
✓ Priority customer support
```

### 3.3 Create Yearly Subscription

#### Basic Information
- **Subscription ID**: `gov_billing_subscription_yearly`
- **Name**: `Yearly Premium Plan`
- **Description**: `Unlimited access to all premium features for 365 days - Save 33%!`

#### Pricing
- **Price**: `$39.99 USD`
- **Billing period**: `1 year`
- **Free trial**: `7 days` (optional)

#### Benefits
Add these benefits in description:
```
✓ UNLIMITED PDF generation
✓ UNLIMITED Print access
✓ UNLIMITED Email sharing
✓ UNLIMITED Save to device
✓ UNLIMITED Social media sharing
✓ Cloud backup included
✓ Priority customer support
✓ SAVE 33% compared to monthly plan
✓ Cancel anytime
```

---

## 🧪 Step 4: Testing Setup

### 4.1 Create License Testers
1. Go to **"Release" → "Testing" → "Internal testing"**
2. Click **"Create new release"**
3. Upload your APK/AAB
4. Add **License testers**:
   - Add Gmail accounts that will test purchases
   - These accounts can make test purchases without being charged

### 4.2 Test Purchases
1. Download app from Internal Testing link
2. Make test purchases
3. Verify purchase flow works correctly

---

## ⚙️ Step 5: Advanced Configuration

### 5.1 Real-time Developer Notifications (Optional)
1. Go to **"Monetize" → "Products" → "Subscriptions"**
2. Click **"Real-time developer notifications"**
3. Set up endpoint URL for subscription status updates

### 5.2 Server-side Verification (Recommended)
1. Set up backend server for receipt validation
2. Configure Google Play Developer API
3. Implement receipt verification endpoint

---

## 📋 Step 6: Final Checklist

### Before Going Live:
- [ ] All product IDs match exactly with app code
- [ ] All prices are set correctly
- [ ] Subscription billing periods configured
- [ ] Test purchases work with license testers
- [ ] App is published to at least Internal Testing
- [ ] Real-time notifications configured (optional)
- [ ] Server-side verification ready (recommended)

### App Store Listing:
- [ ] App description mentions premium features
- [ ] Screenshots show premium functionality
- [ ] Privacy policy updated for purchases
- [ ] Contact information provided

---

## 🚨 Important Notes

### Product ID Requirements:
- **Must be unique** across Google Play Store
- **Cannot be changed** after creation
- **Must match exactly** with IDs in your app code
- **Lowercase letters, numbers, and underscores only**

### Pricing Guidelines:
- **Set competitive prices** for your market
- **Consider local pricing** for different countries
- **Review pricing** regularly based on usage analytics

### Testing Guidelines:
- **Always test** with license tester accounts first
- **Test all purchase flows** before production release
- **Verify subscription renewals** work correctly
- **Test purchase restoration** functionality

---

## 🔧 Troubleshooting

### Common Issues:

#### "Item not found" error:
- Verify product ID matches exactly
- Ensure product is set to "Active" status
- Wait 2-4 hours after creating products

#### "Authentication required" error:
- Check app is signed with release keystore
- Verify app is uploaded to Play Console
- Ensure testing account has access

#### Subscription not renewing:
- Check subscription configuration
- Verify real-time notifications
- Review subscription status in Play Console

---

## 📞 Support Resources

- [Google Play Console Help](https://support.google.com/googleplay/android-developer/)
- [Play Billing Library Documentation](https://developer.android.com/google/play/billing)
- [Subscription Best Practices](https://developer.android.com/google/play/billing/subscriptions)

---

## 🎯 Next Steps After Setup

1. **Monitor Analytics**: Track purchase conversions in Play Console
2. **A/B Testing**: Test different pricing strategies
3. **User Feedback**: Collect feedback on premium features
4. **Regular Updates**: Keep products and pricing competitive
5. **Marketing**: Promote premium features to increase conversions

---

*This documentation covers the complete setup process for Google Play Console. Follow each step carefully and test thoroughly before production release.*
