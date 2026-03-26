// MenuDialog.tsx
import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import {MenuDialogProps} from './types/MenuDialog';
import NavigationManager from './utils/NavigationManager';
import {AppLifecycleAdapter} from './homeSSO';

export const MenuDialog: React.FC<MenuDialogProps> = ({
  userEmail,
  onSignOut,
  visible,
  onClose,
}) => {
  const appLifecycleAdapter = AppLifecycleAdapter.getInstance();
  const [isSignedIn, setIsSignedIn] = useState(
    appLifecycleAdapter.getIsSignedIn(),
  );
  const [isSignedInProgress, setIsSignedInProgress] = useState(
    appLifecycleAdapter.getIsSignInInProgress(),
  );

  useEffect(() => {
    const handleSignInStatusChange = (isSignedIn: boolean | null) => {
      if (isSignedIn !== null) {
        setIsSignedIn(isSignedIn);
      }
    };
    const handleSignInProgressChange = (isSignedInProgress: boolean) => {
      setIsSignedInProgress(isSignedInProgress);
    };

    const listener = {
      onSignedInChange: handleSignInStatusChange,
      onSignInProgressChange: handleSignInProgressChange,
    };
    appLifecycleAdapter.addAppLifecycleListener(listener);

    return () => {
      appLifecycleAdapter.removeAppLifecycleListener(listener);
    };
  }, []);

  useEffect(() => {
    if (isSignedInProgress && visible) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSignedInProgress, visible, onClose]);

  const handleSignInPress = () => {
    console.log('MenuDialog handleSignInPress');
    onClose();
    onSignIn();
  };

  const onSignIn = () => {
    console.log('MenuDialog onSignIn called');
    NavigationManager.getInstance().navigate('SignIn', {
      isClickNavigation: true,
    });
  };

  const handleSignOutPress = async () => {
    console.log('MenuDialog handleSignOutPress');
    onClose();
    onSignOut();
  };

  return (
    <Pressable onPress={onClose}>
      <View style={styles.dialogContainer}>
        <View style={styles.dialog}>
          {isSignedInProgress ? (
            <Text style={styles.statusText}>Signing in, please wait...</Text>
          ) : isSignedIn || userEmail ? (
            <>
              <Text style={styles.profileText}>
                {userEmail || 'Signed In User'}
              </Text>
              <TouchableOpacity
                style={styles.button}
                onPress={handleSignOutPress}
                hasTVPreferredFocus>
                <Text style={styles.buttonText}>Sign Out</Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity
              style={styles.button}
              onPress={handleSignInPress}
              hasTVPreferredFocus>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialogContainer: {
    width: '30%',
    maxWidth: 400,
    minWidth: 300,
    backgroundColor: '#242424',
    borderRadius: 8,
    padding: 20,
  },
  dialog: {
    alignItems: 'center',
  },
  button: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 4,
    marginVertical: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  profileText: {
    color: '#FFFFFF',
    fontSize: 18,
    marginBottom: 16,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
    opacity: 0.8,
  },
});
