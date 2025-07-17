import React, { useState, useEffect } from 'react';
import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonToggle,
  IonButton,
  IonIcon,
  IonToast,
  IonSpinner,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonAlert
} from '@ionic/react';
import { person, cloud, logOut, refresh, settings } from 'ionicons/icons';
import { AuthService } from '../services/AuthService';
import { InAppPurchaseService } from '../services/InAppPurchaseService';
import LoginModal from '../components/LoginModal/LoginModal';

const UserSettingsPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showLogoutAlert, setShowLogoutAlert] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  const authService = new AuthService();
  const inappService = new InAppPurchaseService();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    
    if (authenticated) {
      const token = await authService.getToken();
      // You might want to decode token to get user email
      setUserEmail('user@example.com'); // Replace with actual email from token
    }
  };

  const handleLogin = () => {
    setShowLoginModal(true);
  };

  const handleLoginResult = (result?: any) => {
    setShowLoginModal(false);
    
    if (result) {
      const { status, user, action } = result;
      let actionText = action === 'login' ? 'Login' : 'Registration';
      
      if (status === 'ok' && user) {
        setIsAuthenticated(true);
        setUserEmail(user.email || 'user@example.com');
        setToastMessage(`${actionText} successful!`);
        setShowToast(true);
      } else if (status === 'exists') {
        setToastMessage('User already exists. Log in to continue');
        setShowToast(true);
      } else if (status === 'no') {
        setToastMessage('User does not exist. Register to continue');
        setShowToast(true);
      } else {
        setToastMessage(`${actionText} failed. Try again`);
        setShowToast(true);
      }
    }
  };

  const handleLogout = async () => {
    setShowLogoutAlert(false);
    setIsLoading(true);
    
    const success = await authService.logout();
    if (success) {
      setIsAuthenticated(false);
      setUserEmail('');
      setToastMessage('Logout successful!');
    } else {
      setToastMessage('Logout failed');
    }
    
    setIsLoading(false);
    setShowToast(true);
  };

  const backupPurchases = async () => {
    if (!isAuthenticated) {
      setToastMessage('Please login first');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    const success = await inappService.backupPurchases();
    
    if (success) {
      setToastMessage('Purchases backed up successfully!');
    } else {
      setToastMessage('Failed to backup purchases');
    }
    
    setIsLoading(false);
    setShowToast(true);
  };

  const restorePurchases = async () => {
    if (!isAuthenticated) {
      setToastMessage('Please login first');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    const success = await inappService.restorePurchases();
    
    if (success) {
      setToastMessage('Purchases restored successfully!');
    } else {
      setToastMessage('No purchases to restore');
    }
    
    setIsLoading(false);
    setShowToast(true);
  };

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>User Settings</IonTitle>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ion-padding">
        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Account Status</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonIcon icon={person} slot="start" />
                <IonLabel>
                  <h2>Account</h2>
                  <p>{isAuthenticated ? userEmail : 'Not logged in'}</p>
                </IonLabel>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={isAuthenticated ? () => setShowLogoutAlert(true) : handleLogin}
                  disabled={isLoading}
                >
                  {isLoading ? <IonSpinner name="crescent" /> : 
                   isAuthenticated ? 'Logout' : 'Login'}
                </IonButton>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <IonCard>
          <IonCardHeader>
            <IonCardTitle>Cloud Services</IonCardTitle>
          </IonCardHeader>
          <IonCardContent>
            <IonList>
              <IonItem>
                <IonIcon icon={cloud} slot="start" />
                <IonLabel>
                  <h2>Backup Purchases</h2>
                  <p>Save your purchases to the cloud</p>
                </IonLabel>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={backupPurchases}
                  disabled={!isAuthenticated || isLoading}
                >
                  {isLoading ? <IonSpinner name="crescent" /> : 'Backup'}
                </IonButton>
              </IonItem>
              
              <IonItem>
                <IonIcon icon={refresh} slot="start" />
                <IonLabel>
                  <h2>Restore Purchases</h2>
                  <p>Restore your purchases from the cloud</p>
                </IonLabel>
                <IonButton
                  fill="outline"
                  size="small"
                  onClick={restorePurchases}
                  disabled={!isAuthenticated || isLoading}
                >
                  {isLoading ? <IonSpinner name="crescent" /> : 'Restore'}
                </IonButton>
              </IonItem>
            </IonList>
          </IonCardContent>
        </IonCard>

        <LoginModal
          isOpen={showLoginModal}
          onDidDismiss={handleLoginResult}
        />

        <IonToast
          isOpen={showToast}
          onDidDismiss={() => setShowToast(false)}
          message={toastMessage}
          duration={3000}
          position="bottom"
        />

        <IonAlert
          isOpen={showLogoutAlert}
          onDidDismiss={() => setShowLogoutAlert(false)}
          header="Logout"
          message="Are you sure you want to logout?"
          buttons={[
            {
              text: 'Cancel',
              role: 'cancel'
            },
            {
              text: 'Logout',
              handler: handleLogout
            }
          ]}
        />
      </IonContent>
    </IonPage>
  );
};

export default UserSettingsPage;
