import { InAppPurchaseService } from './InAppPurchaseService';

/**
 * FeatureAccessService - Controls access to premium features
 * This service ensures users can only access features they've paid for
 */
export class FeatureAccessService {
  private inAppService: InAppPurchaseService;

  constructor() {
    this.inAppService = new InAppPurchaseService();
  }

  /**
   * Check if user can generate PDF
   * @returns {Promise<boolean>} true if user has access, false otherwise
   */
  async canGeneratePDF(): Promise<boolean> {
    try {
      // Check if user has active subscription (unlimited access)
      const subscriptionInfo = await this.inAppService.getSubscriptionInfo();
      if (subscriptionInfo?.active && new Date(subscriptionInfo.expiryDate) > new Date()) {
        return true;
      }

      // Check if user has PDF credits
      const inAppData = await this.inAppService.getInappItems();
      const pdfProducts = inAppData.filter(item => 
        ['2014inv10Pdf', '2014inv25Pdf', '2014inv50Pdf', '2014inv100Pdf'].includes(item.Id) &&
        (item.Own - item.Consumed) > 0
      );

      if (pdfProducts.length > 0) {
        // Consume 1 credit from the first available package
        const product = pdfProducts[0];
        await this.consumeCreditForProduct(product.Id);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking PDF access:', error);
      return false;
    }
  }

  /**
   * Check if user can share on social media
   * @param platform - 'facebook', 'twitter', 'whatsapp', 'sms'
   * @returns {Promise<boolean>} true if user has access
   */
  async canShareSocial(platform: 'facebook' | 'twitter' | 'whatsapp' | 'sms'): Promise<boolean> {
    try {
      // Check subscription first
      const subscriptionInfo = await this.inAppService.getSubscriptionInfo();
      if (subscriptionInfo?.active && new Date(subscriptionInfo.expiryDate) > new Date()) {
        return true;
      }

      // Map platform to product ID
      const platformMap = {
        'facebook': '2015inv10fb',
        'twitter': '2015inv10tw',
        'whatsapp': '2015inv10wa',
        'sms': '2015inv10sms'
      };

      const productId = platformMap[platform];
      if (!productId) {
        return false;
      }

      const inAppData = await this.inAppService.getInappItems();
      const product = inAppData.find(item => 
        item.Id === productId && (item.Own - item.Consumed) > 0
      );

      if (product) {
        await this.consumeCreditForProduct(productId);
        return true;
      }

      return false;
    } catch (error) {
      console.error(`Error checking ${platform} share access:`, error);
      return false;
    }
  }

  /**
   * Check if user can email/print/save
   * @returns {Promise<boolean>} true if user has access
   */
  async canEmailPrintSave(): Promise<boolean> {
    try {
      // Check subscription
      const subscriptionInfo = await this.inAppService.getSubscriptionInfo();
      if (subscriptionInfo?.active && new Date(subscriptionInfo.expiryDate) > new Date()) {
        return true;
      }

      // Check email/print/save credits
      const inAppData = await this.inAppService.getInappItems();
      const emailPrintSaveProducts = inAppData.filter(item => 
        ['2015invSavePrintEmail', '2015inv500SavePrintEmail', '2015inv1000SavePrintEmail'].includes(item.Id) &&
        (item.Own - item.Consumed) > 0
      );

      if (emailPrintSaveProducts.length > 0) {
        const product = emailPrintSaveProducts[0];
        await this.consumeCreditForProduct(product.Id);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking email/print/save access:', error);
      return false;
    }
  }

  /**
   * Check if user can save to device
   * @returns {Promise<boolean>} true if user has access
   */
  async canSaveToDevice(): Promise<boolean> {
    try {
      // Check subscription
      const subscriptionInfo = await this.inAppService.getSubscriptionInfo();
      if (subscriptionInfo?.active && new Date(subscriptionInfo.expiryDate) > new Date()) {
        return true;
      }

      const inAppData = await this.inAppService.getInappItems();
      const product = inAppData.find(item => 
        item.Id === '2015inv10save' && (item.Own - item.Consumed) > 0
      );

      if (product) {
        await this.consumeCreditForProduct('2015inv10save');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking save to device access:', error);
      return false;
    }
  }

  /**
   * Check if user can save to cloud
   * @returns {Promise<boolean>} true if user has access
   */
  async canSaveToCloud(): Promise<boolean> {
    try {
      // Check subscription
      const subscriptionInfo = await this.inAppService.getSubscriptionInfo();
      if (subscriptionInfo?.active && new Date(subscriptionInfo.expiryDate) > new Date()) {
        return true;
      }

      const inAppData = await this.inAppService.getInappItems();
      const product = inAppData.find(item => 
        item.Id === '2015invCloud' && (item.Own - item.Consumed) > 0
      );

      if (product) {
        await this.consumeCreditForProduct('2015invCloud');
        return true;
      }

      return false;
    } catch (error) {
      console.error('Error checking cloud save access:', error);
      return false;
    }
  }

  /**
   * Helper method to consume one credit for a product
   */
  private async consumeCreditForProduct(productId: string): Promise<void> {
    try {
      const inAppData = await this.inAppService.getInappItems();
      const productIndex = inAppData.findIndex(item => item.Id === productId);
      
      if (productIndex !== -1 && inAppData[productIndex].Own > inAppData[productIndex].Consumed) {
        inAppData[productIndex].Consumed += 1;
        await this.inAppService.setInappItems(inAppData);
      }
    } catch (error) {
      console.error(`Error consuming credit for ${productId}:`, error);
    }
  }

  /**
   * Get user's current access status for all features
   * @returns {Promise<Object>} Object containing access status for each feature
   */
  async getUserAccessStatus(): Promise<{
    hasActiveSubscription: boolean;
    subscriptionExpiry: string | null;
    pdfCredits: number;
    socialCredits: {
      facebook: number;
      twitter: number;
      whatsapp: number;
      sms: number;
    };
    emailPrintSaveCredits: number;
    saveToDeviceCredits: number;
    cloudSaveCredits: number;
  }> {
    try {
      const subscriptionInfo = await this.inAppService.getSubscriptionInfo();
      const inAppData = await this.inAppService.getInappItems();

      // Calculate PDF credits
      const pdfCredits = inAppData
        .filter(item => ['2014inv10Pdf', '2014inv25Pdf', '2014inv50Pdf', '2014inv100Pdf'].includes(item.Id))
        .reduce((total, item) => total + (item.Own - item.Consumed), 0);

      // Calculate social credits
      const socialCredits = {
        facebook: this.getCreditsForProduct(inAppData, '2015inv10fb'),
        twitter: this.getCreditsForProduct(inAppData, '2015inv10tw'),
        whatsapp: this.getCreditsForProduct(inAppData, '2015inv10wa'),
        sms: this.getCreditsForProduct(inAppData, '2015inv10sms')
      };

      // Calculate other credits
      const emailPrintSaveCredits = inAppData
        .filter(item => ['2015invSavePrintEmail', '2015inv500SavePrintEmail', '2015inv1000SavePrintEmail'].includes(item.Id))
        .reduce((total, item) => total + (item.Own - item.Consumed), 0);

      const saveToDeviceCredits = this.getCreditsForProduct(inAppData, '2015inv10save');
      const cloudSaveCredits = this.getCreditsForProduct(inAppData, '2015invCloud');

      return {
        hasActiveSubscription: subscriptionInfo?.active && new Date(subscriptionInfo.expiryDate) > new Date(),
        subscriptionExpiry: subscriptionInfo?.expiryDate ? new Date(subscriptionInfo.expiryDate).toLocaleDateString() : null,
        pdfCredits,
        socialCredits,
        emailPrintSaveCredits,
        saveToDeviceCredits,
        cloudSaveCredits
      };
    } catch (error) {
      console.error('Error getting user access status:', error);
      return {
        hasActiveSubscription: false,
        subscriptionExpiry: null,
        pdfCredits: 0,
        socialCredits: { facebook: 0, twitter: 0, whatsapp: 0, sms: 0 },
        emailPrintSaveCredits: 0,
        saveToDeviceCredits: 0,
        cloudSaveCredits: 0
      };
    }
  }

  /**
   * Helper method to get credits for a specific product
   */
  private getCreditsForProduct(inAppData: any[], productId: string): number {
    const product = inAppData.find(item => item.Id === productId);
    return product ? (product.Own - product.Consumed) : 0;
  }

  /**
   * Show premium access required dialog
   * @param featureName - Name of the feature user tried to access
   * @returns {Promise<boolean>} true if user wants to purchase
   */
  async showPremiumRequiredDialog(featureName: string): Promise<boolean> {
    return new Promise((resolve) => {
      // This would typically show an Ionic alert
      const userWantsToPurchase = confirm(
        `Premium Feature Required\n\n` +
        `"${featureName}" is a premium feature. You need to:\n\n` +
        `• Purchase individual credits, or\n` +
        `• Subscribe to unlimited access\n\n` +
        `Would you like to view purchase options?`
      );
      
      resolve(userWantsToPurchase);
    });
  }
}

// Export singleton instance
export const featureAccessService = new FeatureAccessService();
