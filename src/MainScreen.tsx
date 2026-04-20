import React, {useState, useEffect, useRef, useCallback} from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  Pressable,
  Platform,
  BackHandler,
} from 'react-native';
import {MenuDialog} from './MenuDialog';
import {videos} from './data/VideoCatalog';
import {User} from './types/Types';
import {AppLifecycleAdapter} from './homeSSO';

interface MainScreenProps {
  signedUserInfo: () => Promise<User>;
  onVideoSelect: (video: any) => void;
  signOut: () => Promise<boolean>;
}

const MainScreen: React.FC<MainScreenProps> = ({
  signedUserInfo,
  onVideoSelect,
  signOut,
}) => {
  const appLifecycleAdapter = AppLifecycleAdapter.getInstance();
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);
  const [showWelcomeMessage, setShowWelcomeMessage] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [focusedItem, setFocusedItem] = useState<string | null>(null);
  const previousSignInState = useRef(appLifecycleAdapter.getIsSignedIn());
  const [isSignedIn, setIsSignedIn] = useState(
    appLifecycleAdapter.getIsSignedIn(),
  );

  useEffect(() => {
    const handleSignInStatusChange = (newIsSignedIn: boolean | null) => {
      if (newIsSignedIn !== null) {
        setIsSignedIn(newIsSignedIn);
      }
    };

    const listener = {
      onSignedInChange: handleSignInStatusChange,
    };
    appLifecycleAdapter.addAppLifecycleListener(listener);
    return () => {
      appLifecycleAdapter.removeAppLifecycleListener(listener);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const getUserInfo = useCallback(async () => {
    const info = await signedUserInfo();
    if (info?.email) {
      setUserEmail(info?.email);
    }
  }, [signedUserInfo]);

  useEffect(() => {
    if (isSignedIn === false) {
      previousSignInState.current = isSignedIn;
    }

    const getAndShowWelcome = async () => {
      if (isSignedIn) {
        setShowWelcomeMessage(true);
        setTimeout(() => {
          setShowWelcomeMessage(false);
        }, 2000);
      }
    };
    if (previousSignInState.current === false && isSignedIn) {
      getAndShowWelcome();
    }
    getUserInfo();
  }, [isSignedIn, getUserInfo]);

  useEffect(() => {
    const handleBackPress = () => {
      if (showMenu) {
        setShowMenu(false);
        return true; // Prevent default behavior (exit app)
      }
      return false; // Allow default behavior
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      subscription.remove();
    };
  }, [showMenu]);

  const handleSignOut = () => {
    signOut()
      .then((result: boolean) => {
        if (result) {
          setShowSuccessMessage(true);
          setTimeout(() => {
            setShowSuccessMessage(false);
            setUserEmail('');
            setIsSignedIn(false);
          }, 2000);
          return Promise.resolve(true);
        } else {
          return Promise.resolve(false);
        }
      })
      .catch(() => {
        return Promise.resolve(false);
      });
    appLifecycleAdapter.setIsSignedIn(false);
  };

  const toggleMenu = () => {
    setShowMenu(!showMenu);
    getUserInfo();
  };

  return (
    <View style={styles.mainContainer}>
      <View style={styles.header}>
        <Text style={styles.appTitle}>Vizbee Demo App</Text>
        <Pressable
          onPress={toggleMenu}
          hasTVPreferredFocus={Platform.isTV}
          onFocus={() => setFocusedItem('settingsButton')}
          onBlur={() => setFocusedItem(null)}
          style={[
            styles.settingsButton,
            focusedItem === 'settingsButton' && styles.focusedButton,
          ]}>
          <Text style={styles.settingsButtonText}>⚙️ Settings</Text>
        </Pressable>
      </View>
      <View style={styles.videoGrid}>
        {videos.map(video => (
          <Pressable
            key={video.guid}
            onPress={() => onVideoSelect(video)}
            onFocus={() => setFocusedItem(video.guid)}
            onBlur={() => setFocusedItem(null)}
            style={[
              styles.videoItem,
              focusedItem === video.guid && styles.focusedItem,
            ]}>
            <Image source={{uri: video.imageURL}} style={styles.thumbnail} />
            <Text style={styles.videoTitle}>{video.title}</Text>
          </Pressable>
        ))}
      </View>
      {showMenu && (
        <View style={styles.menuOverlay}>
          <MenuDialog
            userEmail={userEmail}
            onSignOut={handleSignOut}
            visible={true}
            onClose={() => setShowMenu(false)}
          />
        </View>
      )}
      {/* Success Message Modal */}
      {showSuccessMessage && (
        <View style={styles.menuOverlay}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Sign out successful</Text>
          </View>
        </View>
      )}
      {/* Welcome Message Modal */}
      {showWelcomeMessage && (
        <View style={styles.menuOverlay}>
          <View style={styles.messageContainer}>
            <Text style={styles.messageText}>Welcome, {userEmail}</Text>
          </View>
        </View>
      )}
    </View>
  );
};

export default MainScreen;

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 40,
    position: 'absolute',
    top: 40,
    zIndex: 10,
  },
  appTitle: {
    fontSize: 32,
    color: '#fff',
  },
  settingsButton: {
    backgroundColor: '#242424',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  focusedButton: {
    backgroundColor: '#4A90E2',
    transform: [{scale: 1.1}],
    shadowColor: '#fff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  settingsButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
  },
  videoGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  videoItem: {
    alignItems: 'center',
    marginHorizontal: 20,
    padding: 10,
    borderRadius: 10,
    width: 150,
    height: 300,
  },
  focusedItem: {
    backgroundColor: 'rgba(74, 144, 226, 0.3)',
    transform: [{scale: 1.05}],
    shadowColor: '#fff',
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  thumbnail: {
    width: 150,
    height: 200,
    resizeMode: 'contain',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 22,
    marginTop: 8,
    textAlign: 'center',
  },
  messageContainer: {
    backgroundColor: '#242424',
    padding: 20,
    borderRadius: 8,
    minWidth: 200,
    alignItems: 'center',
  },
  messageText: {
    color: '#FFFFFF',
    fontSize: 18,
    textAlign: 'center',
  },
  menuOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
