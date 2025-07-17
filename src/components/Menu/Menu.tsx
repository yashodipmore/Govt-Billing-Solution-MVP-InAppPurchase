import React, { useState, useEffect } from "react";
import * as AppGeneral from "../socialcalc/index.js";
import { File, Local } from "../Storage/LocalStorage";
import { isPlatform, IonToast } from "@ionic/react";
import { EmailComposer } from "capacitor-email-composer";
import { Printer } from "@ionic-native/printer";
import { IonActionSheet, IonAlert } from "@ionic/react";
import { useHistory } from "react-router-dom";
import { saveOutline, save, mail, print, cart, cloud, person, settings, share } from "ionicons/icons";
import { APP_NAME } from "../../app-data.js";
import { AuthService } from "../../services/AuthService";
import { CloudService } from "../../services/CloudService";
import { InAppPurchaseService } from "../../services/InAppPurchaseService";
import LoginModal from "../LoginModal/LoginModal";

const Menu: React.FC<{
  showM: boolean;
  setM: Function;
  file: string;
  updateSelectedFile: Function;
  store: Local;
  bT: number;
}> = (props) => {
  const history = useHistory();
  const [showAlert1, setShowAlert1] = useState(false);
  const [showAlert2, setShowAlert2] = useState(false);
  const [showAlert3, setShowAlert3] = useState(false);
  const [showAlert4, setShowAlert4] = useState(false);
  const [showShareAlert, setShowShareAlert] = useState(false);
  const [showToast1, setShowToast1] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userLabel, setUserLabel] = useState('Login to Account');

  const authService = new AuthService();
  const cloudService = new CloudService();
  const inAppService = new InAppPurchaseService();

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    const authenticated = await authService.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      setUserLabel('Cloud Account');
    } else {
      setUserLabel('Login to Account');
    }
  };
  /* Utility functions */
  const _validateName = async (filename) => {
    filename = filename.trim();
    if (filename === "default" || filename === "Untitled") {
      setToastMessage("Cannot update default file!");
      return false;
    } else if (filename === "" || !filename) {
      setToastMessage("Filename cannot be empty");
      return false;
    } else if (filename.length > 30) {
      setToastMessage("Filename too long");
      return false;
    } else if (/^[a-zA-Z0-9- ]*$/.test(filename) === false) {
      setToastMessage("Special Characters cannot be used");
      return false;
    } else if (await props.store._checkKey(filename)) {
      setToastMessage("Filename already exists");
      return false;
    }
    return true;
  };

  const getCurrentFileName = () => {
    return props.file;
  };

  const _formatString = (filename) => {
    /* Remove whitespaces */
    while (filename.indexOf(" ") !== -1) {
      filename = filename.replace(" ", "");
    }
    return filename;
  };

  const handleLoginLogout = async () => {
    if (isAuthenticated) {
      // Logout functionality
      const success = await authService.logout();
      if (success) {
        setIsAuthenticated(false);
        setUserLabel('Login to Account');
        setToastMessage('Logout successful!');
        setShowToast1(true);
      }
    } else {
      // Show login modal
      setShowLoginModal(true);
    }
    props.setM(false);
  };

  const handleLoginResult = (result?: any) => {
    setShowLoginModal(false);
    
    if (result) {
      const { status, user, action } = result;
      let actionText = action === 'login' ? 'Login' : 'Registration';
      
      if (status === 'ok' && user) {
        setIsAuthenticated(true);
        setUserLabel('Cloud Account');
        setToastMessage(`${actionText} successful!`);
        setShowToast1(true);
      } else if (status === 'exists') {
        setToastMessage('User already exists. Log in to continue');
        setShowToast1(true);
      } else if (status === 'no') {
        setToastMessage('User does not exist. Register to continue');
        setShowToast1(true);
      } else {
        setToastMessage(`${actionText} failed. Try again`);
        setShowToast1(true);
      }
    }
  };

  const saveToCloud = async () => {
    if (!isAuthenticated) {
      setToastMessage('Please login first');
      setShowToast1(true);
      return;
    }

    const filename = props.file === 'default' ? 'Untitled' : props.file;
    const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
    
    try {
      const result = await cloudService.saveToServer({
        appname: APP_NAME,
        filename: filename,
        content: content
      });
      
      if (result.result === 'ok') {
        setToastMessage(`${filename} saved to cloud successfully!`);
      } else {
        setToastMessage('Failed to save to cloud');
      }
      setShowToast1(true);
    } catch (error) {
      setToastMessage('Error saving to cloud');
      setShowToast1(true);
    }
    props.setM(false);
  };

  const doPrint = async () => {
    // Check if user has purchased print feature
    const canPrint = await inAppService.isSavePrintEmailAvailable();
    
    if (!canPrint) {
      setToastMessage('Please purchase Email/Print/Save package to print documents');
      setShowToast1(true);
      return;
    }

    // Consume one print from purchase
    const remaining = await inAppService.consumePrintSaveEmail();
    
    if (isPlatform("hybrid")) {
      const printer = Printer;
      printer.print(AppGeneral.getCurrentHTMLContent());
    } else {
      const content = AppGeneral.getCurrentHTMLContent();
      const printWindow = window.open("/printwindow", "Print Invoice");
      printWindow.document.write(content);
      printWindow.print();
    }
    
    if (remaining !== false) {
      setToastMessage(`Document printed successfully! ${remaining} prints remaining.`);
      setShowToast1(true);
    }
  };
  const doSave = async () => {
    if (props.file === "default") {
      setShowAlert1(true);
      return;
    }

    // Check if user has purchased save feature
    const canSave = await inAppService.isSavePrintEmailAvailable();
    
    if (!canSave) {
      setToastMessage('Please purchase Email/Print/Save package to save documents');
      setShowToast1(true);
      return;
    }

    // Consume one save from purchase
    const remaining = await inAppService.consumePrintSaveEmail();
    
    const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
    const data = props.store._getFile(props.file);
    const file = new File(
      (data as any).created,
      new Date().toString(),
      content,
      props.file,
      props.bT
    );
    props.store._saveFile(file);
    props.updateSelectedFile(props.file);
    
    if (remaining !== false) {
      setToastMessage(`File saved successfully! ${remaining} saves remaining.`);
      setShowToast1(true);
    } else {
      setShowAlert2(true);
    }
  };

  const doSaveAs = async (filename) => {
    if (filename) {
      if (await _validateName(filename)) {
        // Check if user has purchased save feature
        const canSave = await inAppService.isSavePrintEmailAvailable();
        
        if (!canSave) {
          setToastMessage('Please purchase Email/Print/Save package to save documents');
          setShowToast1(true);
          return;
        }

        // Consume one save from purchase
        const remaining = await inAppService.consumePrintSaveEmail();
        
        const content = encodeURIComponent(AppGeneral.getSpreadsheetContent());
        const file = new File(
          new Date().toString(),
          new Date().toString(),
          content,
          filename,
          props.bT
        );
        props.store._saveFile(file);
        props.updateSelectedFile(filename);
        
        if (remaining !== false) {
          setToastMessage(`File saved as ${filename} successfully! ${remaining} saves remaining.`);
          setShowToast1(true);
        } else {
          setShowAlert4(true);
        }
      } else {
        setShowToast1(true);
      }
    }
  };

  const sendEmail = async () => {
    // Check if user has purchased email feature
    const canEmail = await inAppService.isSavePrintEmailAvailable();
    
    if (!canEmail) {
      setToastMessage('Please purchase Email/Print/Save package to send emails');
      setShowToast1(true);
      return;
    }

    // Consume one email from purchase
    const remaining = await inAppService.consumePrintSaveEmail();
    
    if (isPlatform("hybrid")) {
      const content = AppGeneral.getCurrentHTMLContent();
      const base64 = btoa(content);

      EmailComposer.open({
        to: ["jackdwell08@gmail.com"],
        cc: [],
        bcc: [],
        body: "PFA",
        attachments: [{ type: "base64", path: base64, name: "Invoice.html" }],
        subject: `${APP_NAME} attached`,
        isHtml: true,
      });
      
      if (remaining !== false) {
        setToastMessage(`Email sent successfully! ${remaining} emails remaining.`);
        setShowToast1(true);
      }
    } else {
      alert("This Functionality works on Android/iOS devices");
    }
  };

  const shareDocument = () => {
    setShowShareAlert(true);
  };

  const sharePDF = async (platform: string) => {
    // Check if user has purchased social share feature
    const canShare = await inAppService.isSocialShareAvailable();
    
    if (!canShare) {
      setToastMessage('Please purchase Social Share package to share documents');
      setShowToast1(true);
      return;
    }

    // Consume one share from purchase
    const remaining = await inAppService.consumeSocialShare();
    
    if (remaining === false) {
      setToastMessage('No share credits remaining. Please purchase more.');
      setShowToast1(true);
      return;
    }

    try {
      const content = AppGeneral.getCurrentHTMLContent();
      const pdfResult = await cloudService.createPDF(content);
      
      if (pdfResult.result === 'ok') {
        const pdfUrl = pdfResult.pdfurl;
        const message = `${APP_NAME} PDF document`;
        
        if (isPlatform("hybrid")) {
          // Use Capacitor Social Sharing plugin
          switch (platform) {
            case 'facebook':
              // For Facebook sharing
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pdfUrl)}`, '_blank');
              break;
            case 'twitter':
              // For Twitter sharing
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(message)}&url=${encodeURIComponent(pdfUrl)}`, '_blank');
              break;
            case 'whatsapp':
              // For WhatsApp sharing
              window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(message + ' ' + pdfUrl)}`, '_blank');
              break;
            case 'sms':
              // For SMS sharing
              window.open(`sms:?body=${encodeURIComponent(message + ' ' + pdfUrl)}`, '_blank');
              break;
          }
          
          setToastMessage(`Document shared successfully! ${remaining} shares remaining.`);
          setShowToast1(true);
        } else {
          alert("This functionality works on Android/iOS devices");
        }
      } else {
        setToastMessage('Failed to create PDF for sharing');
        setShowToast1(true);
      }
    } catch (error) {
      setToastMessage('Error sharing document');
      setShowToast1(true);
    }
  };

  return (
    <React.Fragment>
      <IonActionSheet
        animated
        keyboardClose
        isOpen={props.showM}
        onDidDismiss={() => props.setM()}
        buttons={[
          {
            text: "Save",
            icon: saveOutline,
            handler: () => {
              doSave();
              console.log("Save clicked");
              return true;
            },
          },
          {
            text: "Save As",
            icon: save,
            handler: () => {
              setShowAlert3(true);
              console.log("Save As clicked");
              return true;
            },
          },
          {
            text: "Print",
            icon: print,
            handler: () => {
              doPrint();
              console.log("Print clicked");
              return true;
            },
          },
          {
            text: "Email",
            icon: mail,
            handler: () => {
              sendEmail();
              console.log("Email clicked");
              return true;
            },
          },
          {
            text: "Share",
            icon: share,
            handler: () => {
              shareDocument();
              console.log("Share clicked");
              return true;
            },
          },
          {
            text: "In-App Purchase",
            icon: cart,
            handler: () => {
              props.setM(false);
              history.push('/in-app-purchase');
              console.log("In-App Purchase clicked");
              return true;
            },
          },
          {
            text: "Save to Cloud",
            icon: cloud,
            handler: () => {
              saveToCloud();
              return true;
            },
          },
          {
            text: userLabel,
            icon: person,
            handler: () => {
              handleLoginLogout();
              return true;
            },
          },
          {
            text: "User Settings",
            icon: settings,
            handler: () => {
              props.setM(false);
              history.push('/user-settings');
              return true;
            },
          }
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert1}
        onDidDismiss={() => setShowAlert1(false)}
        header="Alert Message"
        message={
          "Cannot update <strong>" + getCurrentFileName() + "</strong> file!"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert2}
        onDidDismiss={() => setShowAlert2(false)}
        header="Save"
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> updated successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showAlert3}
        onDidDismiss={() => setShowAlert3(false)}
        header="Save As"
        inputs={[
          { name: "filename", type: "text", placeholder: "Enter filename" },
        ]}
        buttons={[
          {
            text: "Ok",
            handler: (alertData) => {
              doSaveAs(alertData.filename);
            },
          },
        ]}
      />
      <IonAlert
        animated
        isOpen={showAlert4}
        onDidDismiss={() => setShowAlert4(false)}
        header="Save As"
        message={
          "File <strong>" +
          getCurrentFileName() +
          "</strong> saved successfully"
        }
        buttons={["Ok"]}
      />
      <IonAlert
        animated
        isOpen={showShareAlert}
        onDidDismiss={() => setShowShareAlert(false)}
        header="Share Document"
        message="Choose platform to share your document:"
        inputs={[
          { name: "platform", type: "radio", label: "Facebook", value: "facebook", checked: false },
          { name: "platform", type: "radio", label: "Twitter", value: "twitter", checked: false },
          { name: "platform", type: "radio", label: "WhatsApp", value: "whatsapp", checked: false },
          { name: "platform", type: "radio", label: "SMS", value: "sms", checked: false },
        ]}
        buttons={[
          { text: "Cancel", role: "cancel" },
          {
            text: "Share",
            handler: (data) => {
              if (data) {
                sharePDF(data);
              }
            },
          },
        ]}
      />
      <IonToast
        animated
        isOpen={showToast1}
        onDidDismiss={() => {
          setShowToast1(false);
          setShowAlert3(true);
        }}
        position="bottom"
        message={toastMessage}
        duration={500}
      />
      
      <LoginModal
        isOpen={showLoginModal}
        onDidDismiss={handleLoginResult}
      />
    </React.Fragment>
  );
};

export default Menu;
