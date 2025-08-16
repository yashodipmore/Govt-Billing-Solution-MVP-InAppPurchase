import { Preferences } from '@capacitor/preferences';
import { InAppPurchase2, IAPProduct } from '@awesome-cordova-plugins/in-app-purchase-2';
import { isPlatform } from '@ionic/react';
import { authService } from './authService';

// Create a wrapper class to maintain compatibility
class AuthService {
  async isAuthenticated(): Promise<boolean> {
    const user = authService.getCurrentUser();
    return !!user;
  }

  async getToken(): Promise<string | null> {
    const user = authService.getCurrentUser();
    if (user) {
      return await user.getIdToken();
    }
    return null;
  }
}

// Product IDs
export const PDF_10 = "2014inv10Pdf";
export const PDF_25 = "2014inv25Pdf"; 
export const PDF_50 = "2014inv50Pdf";
export const PDF_100 = "2014inv100Pdf";
export const FB_10 = "2015inv10fb";
export const TW_10 = "2015inv10tw";
export const WA_10 = "2015inv10wa";
export const SMS_10 = "2015inv10sms";
export const SAVE_PDF = "2015inv10save";
export const CLOUD_SAVE = "2015invCloud";
export const SPE_10 = "2015invSavePrintEmail";
export const SPE_500 = "2015inv500SavePrintEmail";
export const SPE_1000 = "2015inv1000SavePrintEmail";

// Subscription Product IDs
export const SUBSCRIPTION_MONTHLY = "gov_billing_subscription_monthly";
export const SUBSCRIPTION_YEARLY = "gov_billing_subscription_yearly";

// Product definitions array
export const INAPP_ITEMS = [
  PDF_10, PDF_25, PDF_50, PDF_100, FB_10, TW_10, 
  WA_10, SMS_10, SAVE_PDF, CLOUD_SAVE, SPE_10, SPE_500, SPE_1000
];

// Subscription products array
export const SUBSCRIPTION_ITEMS = [
  SUBSCRIPTION_MONTHLY, SUBSCRIPTION_YEARLY
];

// Initial local data structure
export const INAPPLOCAL: InAppProduct[] = [
  {"Feature": "10Pdf", "Id": PDF_10, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "25Pdf", "Id": PDF_25, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "50Pdf", "Id": PDF_50, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "100Pdf", "Id": PDF_100, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "10Fb", "Id": FB_10, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "10Tw", "Id": TW_10, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "10Wa", "Id": WA_10, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "10Sms", "Id": SMS_10, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "10iBooks", "Id": SAVE_PDF, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "email-print-save", "Id": SPE_10, "Purchase":"Yes", "Consumed": 0, "Own": 10},
  {"Feature": "email-second-print-save", "Id": SPE_500, "Purchase":"No", "Consumed": 0, "Own": 0},
  {"Feature": "email-third-print-save", "Id": SPE_1000, "Purchase":"No", "Consumed": 0, "Own": 0}
] as const;

export const CLOUDINAPP: InAppProduct[] = [
  {"Feature": "save", "Id": CLOUD_SAVE, "Purchase":"Yes", "Consumed": 0, "Own": 5}
] as const;

export interface InAppProduct {
  Feature: string;
  Id: string;
  Purchase: "Yes" | "No";
  Consumed: number;
  Own: number;
}

export interface SubscriptionInfo {
  type: 'monthly' | 'yearly';
  productId: string;
  startDate: number; // timestamp
  expiryDate: number; // timestamp
  autoRenewing: boolean;
  active: boolean;
}

export interface DisplayItem {
  name: string;
  units: number;
  id: string;
  desc: string;
  price: number;
  icon: string;
  status: boolean;
  type: 'PDF' | 'SPECIAL' | 'OTHER' | 'SUBSCRIPTION';
  expiryDate?: string | null;
}

export class InAppPurchaseService {
  private store: typeof InAppPurchase2;
  private isStoreReady = false;
  private purchaseCallbacks: { [key: string]: (success: boolean) => void } = {};
  private authService: AuthService;
  private activeSubscription: SubscriptionInfo | null = null;
  private priceMap: Map<string, string> = new Map();

  constructor() {
    this.store = InAppPurchase2;
    this.authService = new AuthService();
    
    if (isPlatform('hybrid')) {
      this.initializeStore().catch(err => {
        console.error('Failed to initialize store:', err);
      });
    }
  }

  private async initializeStore(): Promise<void> {
    try {
      // Enable debug logs in development
      this.store.verbosity = this.store.DEBUG;

      // Register all consumable products
      INAPP_ITEMS.forEach(productId => {
        this.store.register({
          id: productId,
          type: this.store.CONSUMABLE
        });
      });
      
      // Register subscription products
      SUBSCRIPTION_ITEMS.forEach(productId => {
        this.store.register({
          id: productId,
          type: this.store.PAID_SUBSCRIPTION
        });
      });
      
      // Load active subscription if exists
      await this.loadActiveSubscription();

      // Setup purchase handling
      this.store.when('product')
        .approved((product: IAPProduct) => {
          return this.handleApproved(product);
        })
        .verified((product: IAPProduct) => {
          return this.handleVerified(product);
        })
        .finished((product: IAPProduct) => {
          this.handleFinished(product);
        })
        .cancelled((product: IAPProduct) => {
          console.log('Purchase was cancelled', product);
          this.purchaseCallbacks[product.id]?.(false);
        })
        .error((err) => {
          console.error('Store error', err);
        });

      // Initialize the store
      await this.store.ready(() => {
        this.isStoreReady = true;
        console.log('Store is ready');
        this.store.refresh();
      });
    } catch (error) {
      console.error('Store initialization failed', error);
      throw error;
    }
  }

  private async handleApproved(product: IAPProduct): Promise<void> {
    try {
      // First verify the purchase
      product.verify();
      
      // Validate receipt (in a real app, this would check with the server)
      const isValid = await this.validateReceipt(product);
      if (!isValid) {
        throw new Error('Receipt validation failed');
      }
      
      // Handle the purchase success
      await this._handlePurchaseSuccess(product.id);
      
      // Mark the product as finished (consumed)
      return product.finish();
    } catch (err) {
      console.error('Error in purchase approval', err);
      throw err;
    }
  }

  private async handleVerified(product: IAPProduct): Promise<void> {
    console.log('Purchase was verified', product);
    this.purchaseCallbacks[product.id]?.(true);
  }

  private async validateReceipt(product: IAPProduct): Promise<boolean> {
    if (!isPlatform('hybrid')) {
      return true; // Skip validation in web environment
    }

    try {
      // In a production app, you would send receipt to your server for validation
      // const receipt = product.transaction?.receipt || '';
      // const response = await fetch('your-validation-endpoint', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ receipt, productId: product.id })
      // });
      // const result = await response.json();
      // return result.isValid;

      // For now, we'll just return true
      console.log('Receipt validation would happen here in production');
      return true;
    } catch (error) {
      console.error('Receipt validation error:', error);
      return false;
    }
  }

  private handleFinished(product: IAPProduct): void {
    console.log('Purchase was finished', product);
  }

  private async loadActiveSubscription(): Promise<void> {
    try {
      const subscriptionData = await Preferences.get({ key: 'activeSubscription' });
      if (subscriptionData.value) {
        const subscription = JSON.parse(subscriptionData.value) as SubscriptionInfo;
        
        // Check if subscription is still valid
        if (subscription.expiryDate > Date.now()) {
          this.activeSubscription = subscription;
          
          // If subscription will expire in the next 3 days, we should notify the user to renew
          const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
          if (subscription.expiryDate - Date.now() < threeDaysMs) {
            console.log('Subscription will expire soon, notify user');
            // You can implement notification logic here
          }
        } else {
          // Subscription expired
          this.activeSubscription = null;
          await Preferences.remove({ key: 'activeSubscription' });
        }
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  }

  private async saveSubscription(subscription: SubscriptionInfo): Promise<void> {
    try {
      this.activeSubscription = subscription;
      await Preferences.set({
        key: 'activeSubscription',
        value: JSON.stringify(subscription)
      });
    } catch (error) {
      console.error('Error saving subscription:', error);
    }
  }

  async purchaseSubscription(productId: string): Promise<boolean> {
    if (!isPlatform('hybrid')) {
      return Promise.reject('Subscriptions are only available on mobile devices');
    }

    if (!this.isStoreReady) {
      throw new Error('Store not ready');
    }

    if (productId !== SUBSCRIPTION_MONTHLY && productId !== SUBSCRIPTION_YEARLY) {
      throw new Error('Invalid subscription product ID');
    }
    
    // Check network connectivity
    try {
      // In a real app, you would use Network API to check connectivity
      // const status = await Network.getStatus();
      // if (!status.connected) {
      //   throw new Error('No network connection. Please connect and try again.');
      // }
    } catch (error) {
      console.error('Network check failed:', error);
      // Continue anyway since we can't import Network here easily
    }

    return new Promise((resolve, reject) => {
      try {
        // Set callback for this purchase
        this.purchaseCallbacks[productId] = async (success: boolean) => {
          if (success) {
            // Create subscription info
            const subscriptionType = productId === SUBSCRIPTION_MONTHLY ? 'monthly' : 'yearly';
            const now = Date.now();
            const expiryDate = productId === SUBSCRIPTION_MONTHLY 
              ? now + (30 * 24 * 60 * 60 * 1000) // 30 days
              : now + (365 * 24 * 60 * 60 * 1000); // 365 days
            
            const subscription: SubscriptionInfo = {
              type: subscriptionType,
              productId,
              startDate: now,
              expiryDate,
              autoRenewing: true,
              active: true
            };
            
            await this.saveSubscription(subscription);
            resolve(true);
          } else {
            reject(new Error('Subscription purchase cancelled'));
          }
          delete this.purchaseCallbacks[productId];
        };

        // Order the product
        const product = this.store.get(productId);
        if (!product) {
          throw new Error('Subscription product not found');
        }
        this.store.order(productId);
      } catch (error) {
        reject(error);
      }
    });
  }

  async hasActiveSubscription(): Promise<boolean> {
    await this.loadActiveSubscription();
    return !!this.activeSubscription;
  }

  async getSubscriptionInfo(): Promise<SubscriptionInfo | null> {
    await this.loadActiveSubscription();
    return this.activeSubscription;
  }

  async getSubscriptionExpiry(): Promise<string> {
    await this.loadActiveSubscription();
    if (!this.activeSubscription) {
      return 'No active subscription';
    }
    
    const expiryDate = new Date(this.activeSubscription.expiryDate);
    return expiryDate.toLocaleDateString();
  }

  async cancelSubscription(): Promise<boolean> {
    // In a real app, you would call your backend to cancel the subscription
    // For now, we'll just clear the local data
    if (!this.activeSubscription) {
      return false;
    }
    
    try {
      await Preferences.remove({ key: 'activeSubscription' });
      this.activeSubscription = null;
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  async loadItems(): Promise<void> {
    if (!isPlatform('hybrid')) {
      return Promise.resolve();
    }

    if (!this.isStoreReady) {
      await this.store.ready(() => {
        this.isStoreReady = true;
      });
    }
    await this.store.refresh();
  }

  async setInappItems(items: InAppProduct[]) {
    await Preferences.set({
      key: 'inapplocal',
      value: JSON.stringify(items)
    });
  }

  async getInappItems(): Promise<InAppProduct[]> {
    const result = await Preferences.get({ key: 'inapplocal' });
    if (!result.value) {
      await this.setInappItems(INAPPLOCAL);
      return INAPPLOCAL;
    }
    return JSON.parse(result.value);
  }

  async setCloudItem(item: InAppProduct) {
    await Preferences.set({
      key: 'cloudInapp',
      value: JSON.stringify(item)
    });
  }

  async getCloudItem() {
    const result = await Preferences.get({ key: 'cloudInapp' });
    if (!result.value) {
      await this.setInappItems(CLOUDINAPP);
      return CLOUDINAPP;
    }
    return JSON.parse(result.value);
  }

  async purchaseItem(id: string): Promise<boolean> {
    console.log(`Attempting to purchase item: ${id}`);
    
    if (!isPlatform('hybrid')) {
      console.log('Purchase rejected: Not on a mobile device');
      return Promise.reject('In-app purchases are only available on mobile devices');
    }

    if (!this.isStoreReady) {
      console.log('Purchase rejected: Store not ready');
      throw new Error('Store not ready');
    }

    return new Promise((resolve, reject) => {
      try {
        // Set callback for this purchase
        this.purchaseCallbacks[id] = (success: boolean) => {
          if (success) {
            resolve(true);
          } else {
            reject(new Error('Purchase cancelled'));
          }
          delete this.purchaseCallbacks[id];
        };

        // Order the product
        const product = this.store.get(id);
        if (!product) {
          throw new Error('Product not found');
        }
        this.store.order(id);
      } catch (error) {
        reject(error);
      }
    });
  }

  async displayItems(): Promise<DisplayItem[]> {
    const items = await this.getInappItems();
    const displayItems: DisplayItem[] = [];
    
    // Add subscription options
    const hasActiveSubscription = await this.hasActiveSubscription();
    const subscriptionInfo = await this.getSubscriptionInfo();
    
    // Add Monthly Subscription
    displayItems.push({
      name: 'Monthly Subscription Plan',
      units: hasActiveSubscription && subscriptionInfo?.type === 'monthly' ? Infinity : 0,
      id: SUBSCRIPTION_MONTHLY,
      desc: '✓ UNLIMITED: PDFs\n✓ UNLIMITED: Print\n✓ UNLIMITED: Email\n✓ UNLIMITED: Save\n✓ UNLIMITED: Social Share\n✓ 30 days access\n✓ Cloud backup included',
      price: 4.99,
      icon: 'infinite',
      status: hasActiveSubscription && subscriptionInfo?.type === 'monthly',
      type: 'SUBSCRIPTION',
      expiryDate: hasActiveSubscription && subscriptionInfo?.type === 'monthly' ? 
        new Date(subscriptionInfo.expiryDate).toLocaleDateString() : null
    });
    
    // Add Yearly Subscription
    displayItems.push({
      name: 'Yearly Subscription Plan',
      units: hasActiveSubscription && subscriptionInfo?.type === 'yearly' ? Infinity : 0,
      id: SUBSCRIPTION_YEARLY,
      desc: '✓ UNLIMITED: PDFs\n✓ UNLIMITED: Print\n✓ UNLIMITED: Email\n✓ UNLIMITED: Save\n✓ UNLIMITED: Social Share\n✓ 365 days access\n✓ Cloud backup included\n✓ SAVE 33% vs monthly plan',
      price: 39.99,
      icon: 'infinite',
      status: hasActiveSubscription && subscriptionInfo?.type === 'yearly',
      type: 'SUBSCRIPTION',
      expiryDate: hasActiveSubscription && subscriptionInfo?.type === 'yearly' ? 
        new Date(subscriptionInfo.expiryDate).toLocaleDateString() : null
    });

    for (const item of items) {
      let desc = '';
      let price = 0;
      let icon = '';
      let status = false;
      const units = item.Own - item.Consumed;

      switch(item.Feature) {
        case "10Pdf":
          desc = 'One-time Purchase: 10 PDF Credits';
          price = 0.99;
          icon = 'document';
          break;
        case "25Pdf":
          desc = 'One-time Purchase: 25 PDF Credits';
          price = 1.99;
          icon = 'document';
          break;
        case "50Pdf":
          desc = 'One-time Purchase: 50 PDF Credits';
          price = 2.99;
          icon = 'document';
          break;
        case "100Pdf":
          desc = 'One-time Purchase: 100 PDF Credits';
          price = 3.99;
          icon = 'document';
          break;
        case "10Fb":
          desc = 'One-time Purchase: 10 Facebook Share Credits';
          price = 0.99;
          icon = 'logo-facebook';
          break;
        case "10Tw":
          desc = 'One-time Purchase: 10 Twitter Share Credits';
          price = 0.99;
          icon = 'logo-twitter';
          break;
        case "10Wa":
          desc = 'One-time Purchase: 10 WhatsApp Share Credits';
          price = 0.99;
          icon = 'logo-whatsapp';
          break;
        case "10Sms":
          desc = 'One-time Purchase: 10 SMS Share Credits';
          price = 0.99;
          icon = 'mail';
          break;
        case "email-print-save":
          desc = 'One-time Purchase: 10 Email/Print/Save Credits';
          price = 0.99;
          icon = 'more';
          break;
        case "email-second-print-save":
          desc = 'One-time Purchase: 500 Email/Print/Save Credits';
          price = 3.99;
          icon = 'more';
          break;
        case "email-third-print-save":
          desc = 'One-time Purchase: 1000 Email/Print/Save Credits';
          price = 6.99;
          icon = 'more';
          break;
      }

      if (units > 0 && item.Purchase === 'Yes') {
        status = true;
      }

      if (item.Feature !== "10iBooks") {
        displayItems.push({
          name: item.Feature,
          units: units,
          id: item.Id,
          desc: desc,
          price: price,
          icon: icon,
          status: status,
          type: item.Feature.includes('Pdf') ? 'PDF' : 'OTHER'
        });
      }
    }

    return displayItems;
  }

  /**
   * Categorize items by type for better display in the UI
   * @param items List of display items
   * @returns Items grouped by category
   */
  categorizeItems(items: DisplayItem[]): { [category: string]: DisplayItem[] } {
    const categorized: { [category: string]: DisplayItem[] } = {};
    
    // First add subscription category
    categorized['Subscription Plans'] = items.filter(item => item.type === 'SUBSCRIPTION');
    
    // Then add other categories
    items.forEach(item => {
      if (item.type === 'SUBSCRIPTION') return; // Already handled
      
      let category = 'Other';
      
      if (item.desc.includes('PDF')) {
        category = 'PDF Packages';
      } else if (item.desc.includes('Share') || 
                item.desc.includes('Facebook') || 
                item.desc.includes('Twitter') ||
                item.desc.includes('WhatsApp') ||
                item.desc.includes('SMS')) {
        category = 'Sharing Options';
      } else if (item.desc.includes('Email') || 
                item.desc.includes('Print') || 
                item.desc.includes('Save')) {
        category = 'Document Actions';
      }
      
      if (!categorized[category]) {
        categorized[category] = [];
      }
      
      categorized[category].push(item);
    });
    
    return categorized;
  }

  async incrementCounter(index: number) {
    const products = await this.getInappItems();
    let consumed = products[index].Consumed;
    consumed++;
    
    if (consumed == products[index].Own) {
      products[index].Purchase = 'No';
      products[index].Consumed = 0;
      products[index].Own = 0;
    } else {
      products[index].Consumed = consumed;
    }

    const left = products[index].Own - products[index].Consumed;
    await this.setInappItems(products);
    return left;
  }

  async isPDFAvailable() {
    // Check if user has active subscription first
    const hasSubscription = await this.hasActiveSubscription();
    if (hasSubscription) {
      return true; // Subscription includes unlimited access to all features
    }

    // If no subscription, check individual purchases
    const products = await this.getInappItems();
    for (let i = 0; i < 4; i++) {
      if (products[i].Purchase === 'Yes') {
        const units = products[i].Own - products[i].Consumed;
        if (units > 0) return true;
      }
    }
    return false;
  }

  async isSavePrintEmailAvailable() {
    // Check if user has active subscription first
    const hasSubscription = await this.hasActiveSubscription();
    if (hasSubscription) {
      return true; // Subscription includes unlimited access to all features
    }

    // If no subscription, check individual purchases
    const products = await this.getInappItems();
    for (let i = 9; i <= 11; i++) {
      if (products[i].Purchase === 'Yes') {
        const units = products[i].Own - products[i].Consumed;
        if (units > 0) return true;
      }
    }
    return false;
  }

  async isSocialShareAvailable() {
    // Check if user has active subscription first
    const hasSubscription = await this.hasActiveSubscription();
    if (hasSubscription) {
      return true; // Subscription includes unlimited access to all features
    }

    // If no subscription, check individual purchases
    const products = await this.getInappItems();
    for (let i = 4; i <= 7; i++) { // Facebook, Twitter, WhatsApp, SMS
      if (products[i].Purchase === 'Yes') {
        const units = products[i].Own - products[i].Consumed;
        if (units > 0) return true;
      }
    }
    return false;
  }

  async consumePrintSaveEmail() {
    // Check if user has active subscription first
    const hasSubscription = await this.hasActiveSubscription();
    if (hasSubscription) {
      return Infinity; // Subscription includes unlimited access, return Infinity to indicate unlimited usage
    }
    
    const products = await this.getInappItems();
    for (let i = 9; i <= 11; i++) {
      if (products[i].Purchase === 'Yes' && 
          products[i].Consumed < products[i].Own) {
        return this.incrementCounter(i);
      }
    }
    return false;
  }

  async consumePDF() {
    // Check if user has active subscription first
    const hasSubscription = await this.hasActiveSubscription();
    if (hasSubscription) {
      return Infinity; // Subscription includes unlimited access, return Infinity to indicate unlimited usage
    }
    
    const products = await this.getInappItems();
    for (let i = 0; i < 4; i++) {
      if (products[i].Purchase === 'Yes' && 
          products[i].Consumed < products[i].Own) {
        return this.incrementCounter(i);
      }
    }
    return false;
  }

  async consumeSocialShare() {
    // Check if user has active subscription first
    const hasSubscription = await this.hasActiveSubscription();
    if (hasSubscription) {
      return Infinity; // Subscription includes unlimited access, return Infinity to indicate unlimited usage
    }
    
    const products = await this.getInappItems();
    for (let i = 4; i <= 7; i++) {
      if (products[i].Purchase === 'Yes' && 
          products[i].Consumed < products[i].Own) {
        return this.incrementCounter(i);
      }
    }
    return false;
  }

  private async _handlePurchaseSuccess(id: string) {
    const products = await this.getInappItems();
    
    // Find the product index
    const index = products.findIndex(p => p.Id === id);
    if (index === -1) return;

    // Update the product
    products[index].Purchase = "Yes";
    
    // Add units based on product type
    switch(products[index].Feature) {
      case "10Pdf":
        products[index].Own = 10 + (products[index].Own - products[index].Consumed);
        break;
      case "25Pdf":
        products[index].Own = 25 + (products[index].Own - products[index].Consumed);
        break;
      case "50Pdf":
        products[index].Own = 50 + (products[index].Own - products[index].Consumed);
        break;
      case "100Pdf":
        products[index].Own = 100 + (products[index].Own - products[index].Consumed);
        break;
      case "10Fb":
      case "10Tw":
      case "10Wa":
      case "10Sms":
        products[index].Own = 10 + (products[index].Own - products[index].Consumed);
        break;
      case "email-print-save":
        products[index].Own = 10 + (products[index].Own - products[index].Consumed);
        break;
      case "email-second-print-save":
        products[index].Own = 500 + (products[index].Own - products[index].Consumed);
        break;
      case "email-third-print-save":
        products[index].Own = 1000 + (products[index].Own - products[index].Consumed);
        break;
    }

    products[index].Consumed = 0;
    
    await this.setInappItems(products);
    return products;
  }

  async updatePDF() {
    const products = await this.getInappItems();
    for (let i = 0; i < 4; i++) {
      if (products[i].Purchase === 'Yes') {
        return this.incrementCounter(i);
      }
    }
  }

  async updateSavePrintEmail() {
    const products = await this.getInappItems();
    for (let i = 9; i <= 11; i++) {
      if (products[i].Purchase === 'Yes' && 
          products[i].Consumed <= products[i].Own) {
        return this.incrementCounter(i);
      }
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
      const isAuth = await this.authService.isAuthenticated();
      if (!isAuth) {
        console.log('User not authenticated');
        return false;
      }

      const token = await this.authService.getToken();
      if (!token) {
        console.log('No token found');
        return false;
      }

      // For now, just return true as cloud service is not available
      // In production, you would restore from cloud service
      console.log('Restore purchases called');
      return true;
    } catch (error) {
      console.error('Restore purchases failed:', error);
      return false;
    }
  }

  async backupPurchases(): Promise<boolean> {
    try {
      const isAuth = await this.authService.isAuthenticated();
      if (!isAuth) {
        console.log('User not authenticated');
        return false;
      }

      const purchases = await this.getInappItems();
      const activePurchases = purchases.filter(p => p.Purchase === 'Yes' && p.Own > 0);
      
      if (activePurchases.length === 0) {
        return true; // Nothing to backup
      }

      // For now, just return true as cloud service is not available
      // In production, you would backup to cloud service
      console.log('Backup purchases called');
      return true;
    } catch (error) {
      console.error('Backup purchases failed:', error);
      return false;
    }
  }

  /**
   * Get documentation about purchase options to display to the user
   * @returns Object with documentation sections
   */
  getPurchaseDocumentation(): { title: string, content: string }[] {
    return [
      {
        title: 'Subscription Plans',
        content: 'Subscribe for unlimited access to all premium features. Choose between monthly or yearly plans. With a subscription, you\'ll never run out of credits for any feature.'
      },
      {
        title: 'One-time Purchases',
        content: 'If you prefer not to subscribe, you can make one-time purchases for specific features. Each purchase gives you a set number of credits that you can use until they run out.'
      },
      {
        title: 'Which option is right for me?',
        content: 'If you use the app regularly or need multiple features, a subscription provides the best value. If you only occasionally need a specific feature, one-time purchases might be more economical.'
      }
    ];
  }
}
