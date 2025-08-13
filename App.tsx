import React, {useEffect, useRef, useCallback} from 'react';
import {
  NavigationContainer,
  NavigationContainerRefWithCurrent,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {
  createStackNavigator,
  StackNavigationOptions,
} from '@react-navigation/stack';
// @ts-ignore
import {VizbeeManager} from 'react-native-vizbee-receiver-sdk';
import {AppDelegate, useHomeSSOAdapter, SignInScreen} from './src/homeSSO';
import VideoPlayer from './src/VideoPlayer';
import MainScreen from './src/MainScreen';
import {RootStackParamList} from './src/types/Types';
import NavigationManager from './src/utils/NavigationManager';
import {videos} from './src/data/VideoCatalog';
import {MVPD_SIGN_IN_TYPE} from './src/homeSSO/constants/constants';

export const VIZBEE_APPID = 'vzb2000001';

const App = () => {
  const navigationRef =
    createNavigationContainerRef<RootStackParamList>() as NavigationContainerRefWithCurrent<RootStackParamList>;

  const Stack = createStackNavigator<RootStackParamList>();

  const appDelegateRef = useRef<AppDelegate | null>(null);
  const isInitializedRef = useRef(false);

  const {
    initializeHomeSSO,
    signOut,
    appLifecycleAdapter,
    getUserInfo,
    isFireTv,
  } = useHomeSSOAdapter();

  const handleVideoStart = useCallback(
    (videoInfo: any) => {
      const video = videos.find(v => v.guid === videoInfo.guid);
      if (
        (video?.requiresAuthentication || false) &&
        !appLifecycleAdapter.getIsSignedIn()
      ) {
        NavigationManager.getInstance().navigate('SignIn', {
          isClickNavigation: true,
        });
      }
    },
    [appLifecycleAdapter],
  );

  const handleVideoSelect = useCallback(
    (videoInfo: any) => {
      if (
        videoInfo.requiresAuthentication &&
        !appLifecycleAdapter.getIsSignedIn()
      ) {
        NavigationManager.getInstance().navigate('SignIn', {
          isClickNavigation: true,
        });
        if (appDelegateRef.current) {
          appDelegateRef.current.deeplinkStart(videoInfo);
        }
      } else {
        appLifecycleAdapter?.setIsVideoPlaying(true);
        NavigationManager.getInstance().navigate('VideoPlayer', {
          guid: videoInfo.guid,
          title: videoInfo.title,
          isLive: videoInfo.isLive,
          videoUrl: videoInfo.videoURL,
          imageUrl: videoInfo.imageURL,
          streamType: videoInfo.streamType,
          position: 0,
        });
      }
    },
    [appLifecycleAdapter],
  );

  useEffect(() => {
    if (!isInitializedRef.current && appLifecycleAdapter) {
      appDelegateRef.current = new AppDelegate(appLifecycleAdapter);

      VizbeeManager.enableVerboseLogging();
      VizbeeManager.init(VIZBEE_APPID, appDelegateRef.current);
      VizbeeManager.enableVerboseLogging();
      appDelegateRef.current.setOnVideoStartCallback(handleVideoStart);
      appDelegateRef.current.setIsAppReady(true);
      appDelegateRef.current.setCanUseIsFirstVideoLogic(!isFireTv);

      console.log('Initializing HomeSSO');

      initializeHomeSSO();

      isInitializedRef.current = true;
    }

    return () => {
      if (appDelegateRef.current) {
        console.log('Cleaning up AppDelegate');
        appDelegateRef.current.setIsAppReady(false);
        appDelegateRef.current = null;
      }
    };
  }, [appLifecycleAdapter, initializeHomeSSO, handleVideoStart]);

  const screenOptions: StackNavigationOptions = {
    headerShown: false,
    cardStyle: {backgroundColor: '#000'},
  };

  const signInScreenOptions: StackNavigationOptions = {
    headerShown: false,
    cardStyle: {backgroundColor: '#000'},
  };

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={() => {
        if (navigationRef.current) {
          NavigationManager.getInstance().setNavigationRef(
            navigationRef.current,
          );
        }
      }}>
      <Stack.Navigator initialRouteName="Main" screenOptions={screenOptions}>
        <Stack.Screen name="Main">
          {props => (
            <MainScreen
              {...props}
              signOut={signOut}
              appLifecycleAdapter={appLifecycleAdapter}
              signedUserInfo={getUserInfo}
              onVideoSelect={handleVideoSelect}
            />
          )}
        </Stack.Screen>
        <Stack.Screen name="SignIn" options={signInScreenOptions}>
          {props => (
            <SignInScreen
              {...props}
              appLifecycleAdapter={appLifecycleAdapter}
              signInType={MVPD_SIGN_IN_TYPE}
            />
          )}
        </Stack.Screen>
        <Stack.Screen
          name="VideoPlayer"
          component={VideoPlayer}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default App;
