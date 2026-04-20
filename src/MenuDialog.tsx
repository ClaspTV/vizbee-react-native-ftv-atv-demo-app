// MenuDialog.tsx
import React, {useState, useEffect} from 'react';
import {
  StyleSheet,
  View,
  Text,
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
  const [focusedButton, setFocusedButton] = useState<string | null>(null);
  const [isSignedInProgress, setIsSignedInProgress] = useState(
    appLifecycleAdapter.getIsSignInInProgress(),
  );

  useEffect(() => {
    const handleSignInStatusChange = (newIsSignedIn: boolean | null) => {
      if (newIsSignedIn !== null) {
        setIsSignedIn(newIsSignedIn);
      }
    };
    const handleSignInProgressChange = (newIsSignedInProgress: boolean) => {
      setIsSignedInProgress(newIsSignedInProgress);
    };

    const listener = {
      onSignedInChange: handleSignInStatusChange,
      onSignInProgressChange: handleSignInProgressChange,
    };
    appLifecycleAdapter.addAppLifecycleListener(listener);

    return () => {
      appLifecycleAdapter.removeAppLifecycleListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const handleSignOutPress = () => {
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
              <Pressable
                style={[
                  styles.button,
                  focusedButton === 'signOut' && styles.focusedButton,
                ]}
                onPress={handleSignOutPress}
                onFocus={() => setFocusedButton('signOut')}
                onBlur={() => setFocusedButton(null)}
                hasTVPreferredFocus>
                <Text style={styles.buttonText}>Sign Out</Text>
              </Pressable>
            </>
          ) : (
            <Pressable
              style={[
                styles.button,
                focusedButton === 'signIn' && styles.focusedButton,
              ]}
              onPress={handleSignInPress}
              onFocus={() => setFocusedButton('signIn')}
              onBlur={() => setFocusedButton(null)}
              hasTVPreferredFocus>
              <Text style={styles.buttonText}>Sign In</Text>
            </Pressable>
          )}
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
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
  focusedButton: {
    backgroundColor: '#2a6abf',
    transform: [{scale: 1.05}],
    shadowColor: '#fff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 8,
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
