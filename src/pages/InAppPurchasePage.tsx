import React, { useState, useEffect } from 'react';
import { Network } from '@capacitor/network';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonRefresher,
  IonRefresherContent,
  IonIcon,
  IonLabel,
  IonActionSheet,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle,
  IonGrid,
  IonRow,
  IonCol,
  IonButton,
  IonBadge,
  IonSkeletonText,
  IonToast,
  IonFooter,
  IonSpinner,
  IonAlert,
  IonChip,
  IonText,
  IonItemDivider,
  IonItem,
} from '@ionic/react';
import { 
  checkmarkCircle, 
  alertCircle, 
  cartOutline, 
  chevronForward, 
  refresh, 
  infinite,
  documentTextOutline,
  shareOutline,
  mailOutline,
  printOutline,
  diamondOutline,
  timeOutline,
  checkmarkOutline,
  starOutline
} from 'ionicons/icons';
import { InAppPurchaseService } from '../services/InAppPurchaseService';
import './InAppPurchasePage.css';

interface PurchaseItem {
  id: string;
  desc: string;
  price: number;
  status: boolean;
  units: number;
  icon: string;
  type: 'PDF' | 'SPECIAL' | 'OTHER' | 'SUBSCRIPTION';
  expiryDate?: string | null;
  name?: string;
}

const InAppPurchasePage: React.FC = () => {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PurchaseItem | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRestoreAlert, setShowRestoreAlert] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  const inapp = new InAppPurchaseService();

  useEffect(() => {
    const initNetworkAndProducts = async () => {
      // Check initial network status
      const status = await Network.getStatus();
      setIsOnline(status.connected);
      
      // Setup network listener
      const unsubscribe = Network.addListener('networkStatusChange', (status) => {
        setIsOnline(status.connected);
        if (status.connected) {
          // Reload products when network is restored
          setTimeout(() => {
            loadProducts();
            displayItems();
          }, 3000);
        } else {
          setLoaded(false);
          setToastMessage('No network connection. Connect and try again.');
          setShowToast(true);
        }
      });

      // Initial load if online
      if (status.connected) {
        loadProducts();
        displayItems();
      }

      return () => {
        unsubscribe.then(() => {
          console.log('Network listener removed');
        });
      };
    };

    initNetworkAndProducts();
  }, []);

  const loadProducts = async () => {
    try {
      await inapp.loadItems();
      setLoaded(true);
    } catch (error) {
      console.log("Error while loading:", error);
    }
  };

  const displayItems = async () => {
    const displayedItems = await inapp.displayItems();
    setItems(displayedItems);
  };

  const doRefresh = async (event: any) => {
    await displayItems();
    event.detail.complete();
  };

  const showActionForInapp = (item: any) => {
    setSelectedItem(item);
    setShowActionSheet(true);
  };

  const buyItem = async (id: string) => {
    if (isProcessing) {
      setToastMessage('Purchase in progress, please wait...');
      setShowToast(true);
      return;
    }

    // Find the item being purchased
    const itemToBuy = items.find(item => item.id === id);
    if (!itemToBuy) {
      setToastMessage('Item not found');
      setShowToast(true);
      return;
    }

    // Validate purchase before proceeding
    if (!validatePurchase(itemToBuy)) {
      return;
    }
    
    setIsProcessing(true);

    if (!loaded) {
      try {
        await loadProducts();
      } catch (error) {
        setToastMessage('Failed to load products. Please try again.');
        setShowToast(true);
        return;
      }
    }

    try {
      if (itemToBuy.type === 'SUBSCRIPTION') {
        // Handle subscription purchase
        await inapp.purchaseSubscription(id);
      } else {
        // Handle regular item purchase
        await inapp.purchaseItem(id);
      }
      await handlePurchaseSuccess(itemToBuy);
    } catch (error) {
      handlePurchaseError(error, itemToBuy);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePurchaseSuccess = async (item: PurchaseItem) => {
    try {
      // Update display after successful purchase
      await displayItems();
      
      // Show different messages based on item type
      if (item.type === 'SUBSCRIPTION') {
        const subType = item.id.includes('monthly') ? 'monthly' : 'yearly';
        const subInfo = await inapp.getSubscriptionInfo();
        const expiryDate = subInfo ? new Date(subInfo.expiryDate).toLocaleDateString() : 'unknown date';
        setToastMessage(`${subType.charAt(0).toUpperCase() + subType.slice(1)} subscription activated! Valid until ${expiryDate}`);
      } else if (item.type === 'PDF') {
        setToastMessage(`PDF package activated successfully`);
      } else if (item.type === 'SPECIAL') {
        setToastMessage(`${item.units} units added to your account`);
      } else {
        setToastMessage('Purchase successful');
      }
      setShowToast(true);
    } catch (error) {
      console.error('Error updating items after purchase:', error);
    }
  };

  const handlePurchaseError = (error: any, item: PurchaseItem) => {
    console.error('Purchase failed:', error);
    let errorMessage = 'Purchase failed';

    if (error instanceof Error) {
      if (error.message.includes('network')) {
        errorMessage = 'Network error. Please check your connection.';
      } else if (error.message.includes('already purchased')) {
        errorMessage = 'You already own this item.';
      } else if (error.message.includes('payment')) {
        errorMessage = 'Payment failed. Please try again.';
      } else {
        errorMessage = error.message;
      }
    }

    setToastMessage(errorMessage);
    setShowToast(true);
  };

  const validatePurchase = (item: PurchaseItem): boolean => {
    // Validate network connection first
    if (!isOnline) {
      setToastMessage('No network connection. Please connect and try again.');
      setShowToast(true);
      return false;
    }
    
    // Subscription validation
    if (item.type === 'SUBSCRIPTION') {
      // Check if user already has an active subscription
      const hasActiveSubscription = items.some(i => 
        i.type === 'SUBSCRIPTION' && i.status === true && i.id !== item.id
      );
      
      if (hasActiveSubscription) {
        setToastMessage("You already have an active subscription. Please cancel it before subscribing to a different plan.");
        setShowToast(true);
        return false;
      }
      
      return true;
    }

    // PDF Package validation
    if (item.desc.includes('PDF')) {
      // Check if user has an active subscription
      const hasSubscription = items.some(i => i.type === 'SUBSCRIPTION' && i.status);
      if (hasSubscription) {
        setToastMessage("You already have an active subscription that includes unlimited PDF access");
        setShowToast(true);
        return false;
      }
      
      const hasPurchasedPDF = items.some(i => 
        i.desc.includes('PDF') && i.status === true && i.id !== item.id
      );
      if (hasPurchasedPDF) {
        setToastMessage("You already have an active PDF package");
        setShowToast(true);
        return false;
      }
    }

    // Special package validation (for share/special features)
    if (item.type === 'SPECIAL') {
      // Check if user has an active subscription
      const hasSubscription = items.some(i => i.type === 'SUBSCRIPTION' && i.status);
      if (hasSubscription) {
        setToastMessage("You already have an active subscription that includes unlimited access to these features");
        setShowToast(true);
        return false;
      }
      
      const currentUnits = items
        .filter(i => i.type === 'SPECIAL' && i.status)
        .reduce((total, i) => total + i.units, 0);

      if (currentUnits > 30) {
        setToastMessage("Please use your remaining units before purchasing more");
        setShowToast(true);
        return false;
      }
    }

    return true;
  };

  const restorePurchases = async () => {
    setIsRestoring(true);
    setShowRestoreAlert(false);
    
    try {
      const success = await inapp.restorePurchases();
      if (success) {
        await displayItems();
        setToastMessage('Purchases restored successfully!');
      } else {
        setToastMessage('No purchases to restore or please login first');
      }
    } catch (error) {
      setToastMessage('Failed to restore purchases');
    } finally {
      setIsRestoring(false);
      setShowToast(true);
    }
  };

  // Group items by category
  const groupedItems = items.reduce((groups, item) => {
    let category;
    
    if (item.type === 'SUBSCRIPTION') {
      category = 'Subscription Plans';
    } else if (item.desc.includes('PDF')) {
      category = 'PDF Packages';
    } else if (item.desc.includes('Share')) {
      category = 'Sharing Options';
    } else {
      category = 'Additional Features';
    }
    
    if (!groups[category]) {
      groups[category] = [];
    }
    groups[category].push(item);
    return groups;
  }, {});

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(price);
  };

  const renderSkeletons = () => (
    <IonGrid>
      {[1, 2, 3].map((num) => (
        <IonCard key={num} style={{ margin: '16px 8px' }}>
          <IonCardHeader>
            <IonCardTitle>
              <IonSkeletonText animated style={{ width: '70%' }} />
            </IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonSkeletonText animated style={{ width: '90%' }} />
            <IonSkeletonText animated style={{ width: '60%' }} />
          </IonCardContent>
        </IonCard>
      ))}
    </IonGrid>
  );

  const getFeatureIcon = (desc: string) => {
    if (desc.includes('PDF')) return documentTextOutline;
    if (desc.includes('Share') || desc.includes('Facebook') || desc.includes('Twitter') || desc.includes('WhatsApp') || desc.includes('SMS')) return shareOutline;
    if (desc.includes('Email')) return mailOutline;
    if (desc.includes('Print')) return printOutline;
    return checkmarkOutline;
  };

  const renderSubscriptionCard = (item: PurchaseItem) => (
    <IonCard 
      key={item.id} 
      style={{ 
        background: 'white',
        margin: '16px 8px',
        borderRadius: '12px',
        boxShadow: item.status ? '0 4px 20px rgba(76, 175, 80, 0.15)' : '0 4px 16px rgba(0,0,0,0.1)',
        border: item.status ? '2px solid #4CAF50' : '1px solid #e0e0e0',
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      {item.status && (
        <IonChip 
          color="success" 
          style={{ 
            position: 'absolute', 
            top: '16px', 
            right: '16px',
            background: '#4CAF50',
            color: 'white',
            fontWeight: 'bold'
          }}
        >
          <IonIcon icon={diamondOutline} />
          <IonLabel>ACTIVE</IonLabel>
        </IonChip>
      )}
      
      <IonCardHeader style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
          <IonIcon 
            icon={infinite} 
            size="large" 
            style={{ marginRight: '12px', color: '#007bff' }}
          />
          <div>
            <IonCardTitle style={{ fontSize: '1.4em', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {item.name}
            </IonCardTitle>
            <IonText style={{ fontSize: '0.9em', color: '#666' }}>
              {item.id.includes('monthly') ? '30 Days Access' : '365 Days Access'}
            </IonText>
          </div>
        </div>
      </IonCardHeader>
      
      <IonCardContent style={{ paddingTop: 0 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
          <div>
            <div style={{ fontSize: '2.2em', fontWeight: 'bold', margin: 0, color: '#333' }}>
              {formatPrice(item.price)}
            </div>
            {item.id.includes('yearly') && (
              <IonChip color="warning" style={{ margin: '4px 0', background: '#fff3cd', color: '#856404' }}>
                <IonLabel style={{ fontWeight: 'bold' }}>SAVE 33%</IonLabel>
              </IonChip>
            )}
            {item.status && item.expiryDate && (
              <div style={{ marginTop: '8px', fontSize: '0.85em', color: '#666' }}>
                <IonIcon icon={timeOutline} style={{ marginRight: '4px' }} />
                Expires: {item.expiryDate}
              </div>
            )}
          </div>
        </div>
        
        <div style={{ marginBottom: '20px' }}>
          {item.desc.split('\n').map((feature, idx) => (
            <div key={idx} style={{ display: 'flex', alignItems: 'center', margin: '6px 0', fontSize: '0.9em', color: '#555' }}>
              <IonIcon icon={checkmarkCircle} style={{ marginRight: '8px', color: '#4CAF50', fontSize: '1.1em' }} />
              <span>{feature.replace('✓ ', '')}</span>
            </div>
          ))}
        </div>
        
        <IonButton
          expand="block"
          onClick={() => showActionForInapp(item)}
          disabled={isProcessing}
          color={item.status ? 'success' : 'primary'}
          style={{ 
            fontWeight: 'bold',
            height: '48px',
            borderRadius: '8px'
          }}
        >
          {isProcessing && selectedItem?.id === item.id ? (
            <>
              <IonSpinner name="crescent" />
              &nbsp;Processing...
            </>
          ) : (
            <>
              <IonIcon slot="start" icon={item.status ? diamondOutline : starOutline} />
              {item.status ? 'Manage Subscription' : 'Subscribe Now'}
            </>
          )}
        </IonButton>
      </IonCardContent>
    </IonCard>
  );

  const renderRegularCard = (item: PurchaseItem) => (
    <IonCard 
      key={item.id}
      style={{ 
        margin: '12px 8px',
        borderRadius: '12px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
        border: item.status ? '2px solid #4CAF50' : '1px solid #e0e0e0'
      }}
    >
      <IonCardHeader style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <IonIcon 
              icon={getFeatureIcon(item.desc)} 
              color={item.status ? 'success' : 'primary'}
              style={{ 
                marginRight: '12px', 
                fontSize: '1.5em',
                padding: '8px',
                background: item.status ? 'rgba(76, 175, 80, 0.1)' : 'rgba(63, 81, 181, 0.1)',
                borderRadius: '8px'
              }}
            />
            <div>
              <IonCardTitle style={{ fontSize: '1.1em', margin: 0, color: '#333' }}>
                {item.desc.replace('One-time Purchase: ', '')}
              </IonCardTitle>
              {item.status && (
                <IonBadge 
                  color={item.units > 3 ? 'success' : 'warning'}
                  style={{ marginTop: '4px', padding: '4px 8px' }}
                >
                  {item.units} units remaining
                </IonBadge>
              )}
            </div>
          </div>
          {item.status && (
            <IonIcon 
              icon={checkmarkCircle} 
              color="success" 
              style={{ fontSize: '1.8em' }}
            />
          )}
        </div>
      </IonCardHeader>
      
      <IonCardContent style={{ paddingTop: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '1.8em', fontWeight: 'bold', color: '#333', margin: 0 }}>
              {formatPrice(item.price)}
            </div>
            <div style={{ fontSize: '0.85em', color: '#666', marginTop: '2px' }}>
              One-time purchase
            </div>
          </div>
          <IonButton
            onClick={() => showActionForInapp(item)}
            color={item.status ? 'success' : 'primary'}
            disabled={isProcessing}
            style={{ borderRadius: '8px', fontWeight: 'bold' }}
          >
            {isProcessing && selectedItem?.id === item.id ? (
              <>
                <IonSpinner name="crescent" />
                &nbsp;Processing...
              </>
            ) : (
              <>
                <IonIcon slot="start" icon={item.status ? cartOutline : chevronForward} />
                {item.status ? 'Buy More' : 'Purchase'}
              </>
            )}
          </IonButton>
        </div>
      </IonCardContent>
    </IonCard>
  );



  return (
    <IonPage>
      <IonHeader>
        <IonToolbar color="primary">
          <IonTitle>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IonIcon icon={cartOutline} style={{ marginRight: '8px' }} />
              Premium Features
            </div>
          </IonTitle>
          <IonButton
            slot="end"
            fill="clear"
            onClick={() => setShowRestoreAlert(true)}
            disabled={isRestoring}
            style={{ color: 'white' }}
          >
            {isRestoring ? <IonSpinner name="crescent" /> : <IonIcon icon={refresh} />}
          </IonButton>
        </IonToolbar>
        
        {/* Status bar showing network and loading state */}
        <IonToolbar color="light" style={{ minHeight: '48px' }}>
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            padding: '8px 16px',
            fontSize: '0.9em'
          }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <IonIcon 
                icon={isOnline ? checkmarkCircle : alertCircle} 
                color={isOnline ? 'success' : 'danger'}
                style={{ marginRight: '6px' }}
              />
              <span style={{ color: isOnline ? '#4CAF50' : '#f44336' }}>
                {isOnline ? 'Connected' : 'Offline'}
              </span>
            </div>
            
            {loaded && (
              <IonChip color="primary" style={{ margin: 0 }}>
                <IonLabel>{items.length} Products Available</IonLabel>
              </IonChip>
            )}
          </div>
        </IonToolbar>
      </IonHeader>

      <IonContent style={{ '--background': '#f8f9fa' }}>
        <IonRefresher slot="fixed" onIonRefresh={doRefresh}>
          <IonRefresherContent
            pullingIcon={refresh}
            pullingText="Pull to refresh products"
            refreshingSpinner="circles"
            refreshingText="Refreshing..."
          />
        </IonRefresher>

        {/* Welcome section */}
        {loaded && !items.length && (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px',
            background: 'white',
            margin: '16px',
            borderRadius: '12px'
          }}>
            <IonIcon icon={cartOutline} size="large" color="medium" />
            <h2>No Products Available</h2>
            <p style={{ color: '#666' }}>Please check your connection and try again.</p>
          </div>
        )}

        {!loaded ? (
          renderSkeletons()
        ) : (
          Object.entries(groupedItems).map(([category, categoryItems]: [string, any[]]) => (
            <div key={category} style={{ marginBottom: '24px' }}>
              <IonItemDivider style={{ 
                background: 'white',
                color: '#333',
                fontWeight: 'bold',
                fontSize: '1.1em',
                padding: '16px',
                margin: '16px 8px 8px 8px',
                borderRadius: '8px',
                border: '1px solid #e0e0e0'
              }}>
                <IonIcon 
                  icon={category === 'Subscription Plans' ? infinite : 
                        category === 'PDF Packages' ? documentTextOutline :
                        category === 'Sharing Options' ? shareOutline : checkmarkOutline} 
                  slot="start" 
                  style={{ marginRight: '8px' }}
                />
                <IonLabel>
                  <h2 style={{ margin: 0, color: '#333' }}>{category}</h2>
                  <p style={{ margin: '4px 0 0 0', color: '#666', fontSize: '0.9em' }}>
                    {category === 'Subscription Plans' ? 'Unlimited access to all features' :
                     category === 'PDF Packages' ? 'Generate PDF documents' :
                     category === 'Sharing Options' ? 'Share on social platforms' : 
                     'Additional premium features'}
                  </p>
                </IonLabel>
              </IonItemDivider>
              
              <IonGrid style={{ padding: '0 8px' }}>
                <IonRow>
                  {categoryItems.map((item, index) => (
                    <IonCol size="12" sizeMd={category === 'Subscription Plans' ? "6" : "12"} sizeLg={category === 'Subscription Plans' ? "6" : "6"} key={index}>
                      {item.type === 'SUBSCRIPTION' ? renderSubscriptionCard(item) : renderRegularCard(item)}
                    </IonCol>
                  ))}
                </IonRow>
              </IonGrid>
            </div>
          ))
        )}

        <IonActionSheet
          isOpen={showActionSheet}
          onDidDismiss={() => setShowActionSheet(false)}
          buttons={
            selectedItem?.type === 'SUBSCRIPTION' && selectedItem?.status ? [
              // Subscription management options for active subscriptions
              {
                text: 'View Subscription Details',
                handler: () => {
                  // Show subscription details
                  setToastMessage(`Your subscription is valid until ${selectedItem.expiryDate || 'unknown date'}`);
                  setShowToast(true);
                }
              },
              {
                text: 'Cancel Subscription',
                role: 'destructive',
                handler: async () => {
                  try {
                    const success = await inapp.cancelSubscription();
                    if (success) {
                      await displayItems();
                      setToastMessage('Subscription cancelled successfully');
                    } else {
                      setToastMessage('Failed to cancel subscription');
                    }
                    setShowToast(true);
                  } catch (error) {
                    setToastMessage('Error cancelling subscription');
                    setShowToast(true);
                  }
                }
              },
              {
                text: 'Close',
                role: 'cancel'
              }
            ] : [
              // Regular purchase options
              {
                text: selectedItem?.status ? 'Buy More' : 'Confirm Purchase',
                role: 'destructive',
                handler: () => {
                  if (selectedItem) {
                    buyItem(selectedItem.id);
                  }
                }
              },
              {
                text: 'Cancel',
                role: 'cancel'
              }
            ]
          }
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        <IonAlert
          isOpen={showRestoreAlert}
          onDidDismiss={() => setShowRestoreAlert(false)}
          header="Restore Purchases"
          message="This will restore your previous purchases from the cloud. Make sure you're logged in."
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Restore',
              handler: restorePurchases
            }
          ]}
        />
      </IonContent>

      {!loaded && (
        <IonFooter>
          <IonToolbar color="light">
            <div style={{ 
              textAlign: 'center', 
              padding: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <IonSpinner name="crescent" color="primary" />
              <IonLabel style={{ marginLeft: '12px', fontWeight: 'bold' }}>
                Loading premium features...
              </IonLabel>
            </div>
          </IonToolbar>
        </IonFooter>
      )}
      
      {loaded && (
        <IonFooter>
          <IonToolbar color="light">
            <div style={{ 
              textAlign: 'center', 
              padding: '12px 16px',
              fontSize: '0.85em',
              color: '#666'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IonIcon icon={checkmarkCircle} color="success" style={{ marginRight: '4px' }} />
                  Secure Payments
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IonIcon icon={infinite} color="primary" style={{ marginRight: '4px' }} />
                  Instant Access
                </div>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <IonIcon icon={refresh} color="medium" style={{ marginRight: '4px' }} />
                  Restore Anytime
                </div>
              </div>
            </div>
          </IonToolbar>
        </IonFooter>
      )}
    </IonPage>
  );
};

export default InAppPurchasePage;
