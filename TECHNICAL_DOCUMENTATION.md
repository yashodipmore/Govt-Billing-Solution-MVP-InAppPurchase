# Technical Documentation: In-App Purchase, Subscription, Login & Cloud Server Integration

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Authentication System](#authentication-system)
4. [In-App Purchase Implementation](#in-app-purchase-implementation)
5. [Subscription System](#subscription-system)
6. [Cloud Service Integration](#cloud-service-integration)
7. [Local Storage System](#local-storage-system)
8. [Key Components](#key-components)
9. [Product IDs Configuration](#product-ids-configuration)
10. [Purchase Flow](#purchase-flow)
11. [Subscription Management](#subscription-management)
12. [Error Handling](#error-handling)
13. [Testing & Deployment](#testing--deployment)

---

## Overview

This document details the implementation of the in-app purchase and subscription system for the Government Billing Solution mobile application. The system enables users to purchase various digital products (PDF exports, social sharing capabilities, etc.) and subscription plans while providing seamless integration with authentication and cloud storage services.

### Key Features
- Multiple one-time purchase options for digital products
- Monthly and yearly subscription plans
- User authentication (login/register)
- Local and cloud storage for user data
- Purchase tracking and restoration

---

## Architecture

The implementation follows a modular architecture with specialized services handling different aspects of the application:

- **InAppPurchaseService**: Manages in-app purchases and subscriptions
- **AuthService**: Handles user authentication
- **CloudService**: Manages cloud storage operations
- **Local Storage**: Handles local data persistence through Capacitor Preferences

All services are built using TypeScript with React components leveraging Ionic/React for the UI.

### Technology Stack
- Frontend: Ionic React
- State Management: React Hooks and local state
- Data Storage: Capacitor Preferences API
- In-App Purchase: Ionic Native In-App Purchase 2 plugin
- Authentication: Custom AuthService with REST API
- Cloud Storage: Custom CloudService with REST API

---

## Authentication System

The authentication system is implemented in `AuthService.ts` and enables users to register, login, and maintain their session.

### Key Components

- **AuthService**: Main class that handles all authentication operations
- **Login/Register Modal**: UI component for authentication (LoginModal.tsx)
- **Token Management**: Authentication tokens stored securely with Capacitor Preferences

### Implementation Details

```typescript
// Authentication methods
async login(email: string, password: string): Promise<AuthResponse>
async register(email: string, password: string): Promise<AuthResponse>
async logout(): Promise<boolean>

// Token management
async getToken(): Promise<string | null>
async setToken(token: string): Promise<void>
async removeToken(): Promise<void>
async isAuthenticated(): Promise<boolean>
```

Authentication state is checked in both the Menu component and User Settings page to conditionally render UI elements and enable features that require authentication.

---

## In-App Purchase Implementation

The in-app purchase system is implemented in `InAppPurchaseService.ts` and provides a comprehensive solution for purchasing digital products.

### Key Components

- **InAppPurchaseService**: Core service managing all purchase-related operations
- **Product Types**: PDF packages, Social sharing packages, Email/Print/Save packages
- **Storage**: Purchase state is persisted using Capacitor Preferences

### Implementation Details

#### Core Methods
```typescript
// Initialize the store and register products
private async initializeStore(): Promise<void>

// Purchase handling
async purchaseItem(id: string): Promise<boolean>
private async handleApproved(product: IAPProduct): Promise<void>
private async handleVerified(product: IAPProduct): Promise<void>

// Purchase validation
private async validateReceipt(product: IAPProduct): Promise<boolean>
```

#### Product Management
```typescript
// Track and manage purchases
async incrementCounter(index: number)
async getInappItems(): Promise<InAppProduct[]>
async setInappItems(items: InAppProduct[])

// Feature availability checks
async isPDFAvailable()
async isSavePrintEmailAvailable()
async isSocialShareAvailable()

// Consumption tracking
async consumePDF()
async consumePrintSaveEmail()
async consumeSocialShare()
```

---

## Subscription System

The subscription system is built on top of the in-app purchase infrastructure and offers monthly and yearly subscription plans.

### Key Components

- **Subscription Management**: Methods to handle subscription purchase, validation, and status checking
- **Subscription Info**: Interface defining subscription data structure
- **Storage**: Subscription data stored using Capacitor Preferences

### Implementation Details

#### Core Methods
```typescript
// Purchase subscription
async purchaseSubscription(productId: string): Promise<boolean>

// Subscription management
async saveSubscription(subscription: SubscriptionInfo): Promise<void>
async loadActiveSubscription(): Promise<void>

// Subscription status
async hasActiveSubscription(): Promise<boolean>
async getSubscriptionInfo(): Promise<SubscriptionInfo | null>
async getSubscriptionExpiry(): Promise<string>
async cancelSubscription(): Promise<boolean>
```

#### Subscription Benefits
- Unlimited access to all premium features
- No need to purchase individual feature packages
- Auto-renewing for continued access (configured through Google Play Console)

---

## Cloud Service Integration

The cloud service integration enables users to store and retrieve their files and purchase history from a server.

### Key Components

- **CloudService**: Core service managing all cloud operations
- **API Endpoints**: Server endpoints for file operations, authentication, and purchase restoration
- **Integration with Purchase System**: Backup and restore purchase history

### Implementation Details

#### Core Methods
```typescript
// PDF Operations
async createPDF(content: string): Promise<any>

// File Operations
async saveToServer(data: SaveData): Promise<CloudResponse>
async listFiles(appname: string): Promise<CloudResponse>
async deleteFile(filename: string, appname: string): Promise<CloudResponse>

// Purchase Restoration
async restorePurchases(appname: string, key: string): Promise<CloudResponse>
```

#### Base URL Configuration
```typescript
private baseUrl = 'http://aspiringapps.com/api';
```

---

## Local Storage System

The local storage system uses Capacitor Preferences to persist data on the device.

### Key Components

- **Preferences API**: Used through `@capacitor/preferences`
- **Data Structures**: Files, Purchase Items, Subscription Information

### Implementation Details

#### File Storage
```typescript
// File structure
export class File {
  created: string;
  modified: string;
  name: string;
  content: string;
  billType: number;
}

// Storage operations
_saveFile = async (file: File) => { /* ... */ }
_getFile = async (name: string) => { /* ... */ }
_getAllFiles = async () => { /* ... */ }
_deleteFile = async (name: string) => { /* ... */ }
```

#### Purchase Storage
```typescript
// Storing purchases
async setInappItems(items: InAppProduct[]) {
  await Preferences.set({
    key: 'inapplocal',
    value: JSON.stringify(items)
  });
}

// Retrieving purchases
async getInappItems(): Promise<InAppProduct[]> {
  const result = await Preferences.get({ key: 'inapplocal' });
  if (!result.value) {
    await this.setInappItems(INAPPLOCAL);
    return INAPPLOCAL;
  }
  return JSON.parse(result.value);
}
```

---

## Key Components

### User Interface Components

1. **InAppPurchasePage.tsx**: Main page for displaying and purchasing products
2. **InAppPurchaseContainer.tsx**: Container component for organizing purchase items
3. **InAppPurchaseCard.tsx**: Card component displaying individual purchase items
4. **LoginModal.tsx**: Modal for user authentication
5. **UserSettingsPage.tsx**: Page for managing user settings and subscriptions

### Service Components

1. **InAppPurchaseService.ts**: Manages in-app purchases and subscriptions
2. **AuthService.ts**: Handles user authentication
3. **CloudService.ts**: Manages cloud storage operations
4. **LocalStorage.ts**: Handles local file storage operations

### Data Structures

1. **InAppProduct**: Interface defining purchase item structure
2. **SubscriptionInfo**: Interface defining subscription data
3. **DisplayItem**: Interface for UI display of purchase items
4. **File**: Class defining file structure for storage

---

## Product IDs Configuration

The application defines various product IDs for different types of purchases:

### PDF Packages
```typescript
export const PDF_10 = "2014inv10Pdf";    // 10 PDF Package
export const PDF_25 = "2014inv25Pdf";     // 25 PDF Package
export const PDF_50 = "2014inv50Pdf";     // 50 PDF Package
export const PDF_100 = "2014inv100Pdf";   // 100 PDF Package
```

### Social Sharing Packages
```typescript
export const FB_10 = "2015inv10fb";       // Facebook Sharing Package
export const TW_10 = "2015inv10tw";       // Twitter Sharing Package
export const WA_10 = "2015inv10wa";       // WhatsApp Sharing Package
export const SMS_10 = "2015inv10sms";     // SMS Sharing Package
```

### Save/Print/Email Packages
```typescript
export const SPE_10 = "2015invSavePrintEmail";          // Basic SPE Package
export const SPE_500 = "2015inv500SavePrintEmail";      // Business SPE Package
export const SPE_1000 = "2015inv1000SavePrintEmail";    // Enterprise SPE Package
```

### Subscription Products
```typescript
export const SUBSCRIPTION_MONTHLY = "gov_billing_subscription_monthly";
export const SUBSCRIPTION_YEARLY = "gov_billing_subscription_yearly";
```

---

## Purchase Flow

The purchase flow consists of several steps:

1. **Initialization**: The app initializes the InAppPurchase2 plugin and registers products
2. **Display**: Products are displayed to the user categorized by type
3. **User Selection**: User selects a product to purchase
4. **Checkout**: The app initiates the purchase flow through the store
5. **Validation**: The purchase is validated and recorded
6. **Consumption**: Features are unlocked based on purchases

### Code Flow
```typescript
// 1. User clicks purchase button
handlePurchase = async (id: string) => {
  await inAppService.purchaseItem(id);
}

// 2. Purchase is initiated
async purchaseItem(id: string): Promise<boolean> {
  // Set callback for this purchase
  this.purchaseCallbacks[id] = (success: boolean) => {
    // Handle purchase result
  };
  
  // Order the product
  this.store.order(id);
}

// 3. Purchase is approved (automatic callback)
private async handleApproved(product: IAPProduct): Promise<void> {
  // Verify purchase
  product.verify();
}

// 4. Purchase is verified (automatic callback)
private async handleVerified(product: IAPProduct): Promise<void> {
  // Update purchase records
  await this._handlePurchaseSuccess(product.id);
}

// 5. Purchase is completed
private async _handlePurchaseSuccess(id: string) {
  // Update local records
  const products = await this.getInappItems();
  // Update product counts
  await this.setInappItems(products);
}
```

---

## Subscription Management

### Subscription Purchase Flow

1. **User selects subscription**: Monthly or Yearly plan
2. **Purchase initiated**: Through InAppPurchaseService
3. **Store handles payment**: Google Play processes payment
4. **Subscription is validated**: Receipt validation
5. **Local storage updated**: Subscription details saved locally
6. **Features unlocked**: All premium features made available

### Subscription Data Structure
```typescript
export interface SubscriptionInfo {
  type: 'monthly' | 'yearly';
  productId: string;
  startDate: number;  // timestamp
  expiryDate: number; // timestamp
  autoRenewing: boolean;
  active: boolean;
}
```

### Subscription Status Checking
```typescript
async hasActiveSubscription(): Promise<boolean> {
  await this.loadActiveSubscription();
  return !!this.activeSubscription;
}

private async loadActiveSubscription(): Promise<void> {
  // Load subscription from storage
  // Check if still valid
  // Handle expiry
}
```

---

## Error Handling

Error handling is implemented throughout the application to ensure robustness:

### Network Error Handling
```typescript
try {
  const response = await fetch(`${this.baseUrl}/login`, {
    // request details
  });
  
  return await response.json();
} catch (error) {
  console.error('Login error:', error);
  return { result: 'error', message: 'Login failed' };
}
```

### Purchase Error Handling
```typescript
this.store.when('product')
  .approved((product) => { /* handle approval */ })
  .error((err) => {
    console.error('Store error', err);
    // Show error to user
  });
```

### Graceful Degradation
The app implements fallbacks for various scenarios:
- No network connection: Display cached data
- Purchase failure: Provide clear error message and retry option
- Authentication failure: Guide user through recovery

---

## Testing & Deployment

### Testing In-App Purchases

1. **License Testing**: Set up test accounts in Google Play Console
2. **Test Purchases**: Use test accounts to verify purchase flow
3. **Verification**: Ensure products unlock correctly after purchase
4. **Subscription Testing**: Test subscription lifecycle (purchase, use, renew)

### Deployment

Detailed deployment steps are documented in GOOGLE_PLAY_DEPLOYMENT_GUIDE.md, covering:
1. App signing and keystore generation
2. Google Play Console setup
3. In-app purchase & subscription configuration
4. Testing setup
5. Production release process

---

## Conclusion

This document provides a comprehensive overview of the implementation of the in-app purchase, subscription, authentication, and cloud storage systems in the Government Billing Solution application. By understanding these components and their interactions, developers can maintain and extend the functionality as needed.

For deployment-specific information, please refer to the GOOGLE_PLAY_DEPLOYMENT_GUIDE.md file.
