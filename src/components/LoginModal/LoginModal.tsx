import React, { useState } from 'react';
import {
  IonButton,
  IonContent,
  IonHeader,
  IonInput,
  IonItem,
  IonLabel,
  IonModal,
  IonTitle,
  IonToolbar,
  IonSpinner,
  IonToast,
  IonButtons,
  IonList,
  IonCard,
  IonCardContent,
  IonCardHeader,
  IonCardTitle
} from '@ionic/react';
import { AuthService } from '../../services/AuthService';

interface LoginModalProps {
  isOpen: boolean;
  onDidDismiss: (result?: any) => void;
}

const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onDidDismiss }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const authService = new AuthService();

  const handleLogin = async () => {
    if (!email || !password) {
      setToastMessage('Please fill in all fields');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.login(email, password);
      setIsLoading(false);
      
      onDidDismiss({
        status: result.result,
        user: result.user,
        action: 'login'
      });
    } catch (error) {
      setIsLoading(false);
      setToastMessage('Login failed. Please try again.');
      setShowToast(true);
    }
  };

  const handleRegister = async () => {
    if (!email || !password) {
      setToastMessage('Please fill in all fields');
      setShowToast(true);
      return;
    }

    setIsLoading(true);
    try {
      const result = await authService.register(email, password);
      setIsLoading(false);
      
      onDidDismiss({
        status: result.result,
        user: result.user,
        action: 'register'
      });
    } catch (error) {
      setIsLoading(false);
      setToastMessage('Registration failed. Please try again.');
      setShowToast(true);
    }
  };

  const handleDismiss = () => {
    onDidDismiss();
  };

  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={handleDismiss}>
        <IonHeader>
          <IonToolbar>
            <IonTitle>Login</IonTitle>
            <IonButtons slot="end">
              <IonButton color="primary" fill="clear" onClick={handleDismiss}>
                Cancel
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="ion-padding">
          <IonCard>
            <IonCardHeader>
              <IonCardTitle>Account Access</IonCardTitle>
            </IonCardHeader>
            <IonCardContent>
              <IonList>
                <IonItem>
                  <IonLabel position="stacked">Email</IonLabel>
                  <IonInput
                    type="email"
                    value={email}
                    onIonChange={(e) => setEmail(e.detail.value!)}
                    placeholder="Enter your email"
                  />
                </IonItem>
                
                <IonItem>
                  <IonLabel position="stacked">Password</IonLabel>
                  <IonInput
                    type="password"
                    value={password}
                    onIonChange={(e) => setPassword(e.detail.value!)}
                    placeholder="Enter your password"
                  />
                </IonItem>
              </IonList>
              
              <div className="ion-margin-top">
                <IonButton
                  expand="block"
                  onClick={handleLogin}
                  disabled={isLoading || !email || !password}
                >
                  {isLoading ? <IonSpinner name="crescent" /> : 'Login'}
                </IonButton>
                
                <IonButton
                  expand="block"
                  fill="outline"
                  onClick={handleRegister}
                  disabled={isLoading || !email || !password}
                  className="ion-margin-top"
                >
                  {isLoading ? <IonSpinner name="crescent" /> : 'Register'}
                </IonButton>
              </div>
            </IonCardContent>
          </IonCard>
        </IonContent>
      </IonModal>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={3000}
        position="bottom"
      />
    </>
  );
};

export default LoginModal;
