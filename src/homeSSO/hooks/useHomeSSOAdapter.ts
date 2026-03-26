import {useEffect, useRef} from 'react';

// @ts-ignore
import {useVizbeeHomeSSOReceiver} from 'react-native-vizbee-homesso-receiver-sdk';
import {MvpdRegCodePoller} from '../core/MvpdRegCodePoller';
import {AuthRepository} from '../auth/AuthRepository';
import {AuthManager} from '../auth/AuthManager';
import {SignInCallbackHolder} from '../core/SignInCallbackHolder';
import {AppLifecycleListener} from '../types';
import {
  VizbeeSenderSignInInfo,
  VizbeeSignInInfo,
  // @ts-ignore
} from 'react-native-vizbee-homesso-receiver-sdk';
// @ts-ignore
import {VizbeeManager} from 'react-native-vizbee-receiver-sdk';
import NavigationManager from '../../utils/NavigationManager';
import {AppReadyModel} from '../core/AppReadyModel';
import {MVPD_SIGN_IN_TYPE, SIGN_IN_TIMEOUT_MS} from '../constants/constants';
import VideoEvents from '../../utils/VideoEvents';
import {AppLifecycleAdapter} from '../core/AppLifecycleAdapter';

const LOG_TAG = 'useHomeSSOAdapter';

export const useHomeSSOAdapter = () => {
  const {initialize, sendProgress, sendSuccess, sendFailure, enableLogging} =
    useVizbeeHomeSSOReceiver();
  const appLifecycleAdapter = AppLifecycleAdapter.getInstance();
  const appReadyModelRef = useRef(new AppReadyModel()).current;

  const authManager = useRef(new AuthManager()).current;
  const authRepository = useRef(new AuthRepository()).current;
  const regCodePoller = useRef(new MvpdRegCodePoller(authRepository)).current;
  const timeoutRef = useRef<NodeJS.Timeout>();
  const pendingCallbacksRef = useRef<
    {
      resolve: (value: any) => void;
      reject: (error: any) => void;
    }[]
  >([]);
  const signInProgressInfo = useRef<{
    signInType: string;
    regCode: string;
  } | null>(null);

  useEffect(() => {
    console.log(`${LOG_TAG}: Setting up app lifecycle listener`);

    const listener: AppLifecycleListener = {
      onAppReady: async (appReadyModel: AppReadyModel) => {
        console.log(`${LOG_TAG}: App is ready`);
        appLifecycleAdapter.setIsHomeSSOReady(true);
        checkIsSignedIn();

        if (pendingCallbacksRef.current.length > 0) {
          console.log(`${LOG_TAG}: App is ready, executing pending callbacks`);
          const callbacksToExecute = pendingCallbacksRef.current;
          try {
            const signInInfo = await sendSignInInfo();
            for (const callback of callbacksToExecute) {
              console.log(
                `${LOG_TAG}: Resolving callback with sign in info:`,
                signInInfo,
              );
              callback.resolve(signInInfo);
            }
          } catch (error) {
            console.error(`${LOG_TAG}: Error executing callbacks:`, error);
            for (const callback of callbacksToExecute) {
              callback.reject(error);
            }
          }
          pendingCallbacksRef.current = [];
        }
      },
      onAppUnReady: () => {
        console.log(`${LOG_TAG}: App is not ready`);
        appLifecycleAdapter.setIsHomeSSOReady(false);
      },
      onSignInScreenExitChange: visible => {
        console.log(`${LOG_TAG}: SignIn Screen Exit Event received`);
        if (visible) {
          stopPollingOnBackPress();
        }
        pendingCallbacksRef.current = [];
      },
    };

    appLifecycleAdapter.addAppLifecycleListener(listener);
    appLifecycleAdapter.setAppReady(appReadyModelRef);
    return () => {
      appLifecycleAdapter.clearAppReady();
      appLifecycleAdapter.removeAppLifecycleListener(listener);
    };
  }, []);

  // Subscribe to video events
  useEffect(() => {
    const unsubscribe = VideoEvents.onVideoStopped(() => {
      console.log('Video stopped, removing player delegate');
      appLifecycleAdapter?.setIsVideoPlaying(false);
    });

    return unsubscribe;
  }, []);

  const sendSignInInfo = async () => {
    console.log(`${LOG_TAG}: Sending sign in info`);
    const signedIn = await authManager.isSignedIn(MVPD_SIGN_IN_TYPE);
    const info = await authRepository.getUserInfo();

    const mvpdSignInInfo: VizbeeSignInInfo = {
      signInType: MVPD_SIGN_IN_TYPE,
      isSignedIn: signedIn,
    };
    if (signedIn) {
      mvpdSignInInfo['userLogin'] = info?.email;
      mvpdSignInInfo['userName'] = `name:${info?.email || ''}`;
      mvpdSignInInfo['userSubscriptionType'] = 'subscriptionType-1';
      mvpdSignInInfo['userSubscriptionValue'] = 'subscriptionValue-1';
      mvpdSignInInfo['userSubscriptionRenewalType'] = 'monthly';
      mvpdSignInInfo['userAdditionalInfo'] = {
        customKey1: 'customValue1',
        customKey2: 'customValue2',
      };
    }
    console.log(`${LOG_TAG}: Sign in info:`, mvpdSignInInfo);
    return [mvpdSignInInfo];
  };

  const startBackgroundSignIn = async (signInType: string) => {
    try {
      const code = await regCodePoller.requestCode();
      onProgress(signInType, code);

      regCodePoller.startPoll(code);

      regCodePoller.setOnCheckDoneChangeListener(isDone => {
        if (isDone) {
          console.log('Poll check done:', isDone);
          onSuccess(signInType);
        }
      });

      timeoutRef.current = setTimeout(() => {
        if (appLifecycleAdapter) {
          onFailure(
            signInType,
            'Sign-in timed out',
            false,
            new Error('Sign-in timed out'),
          );
        }
      }, SIGN_IN_TIMEOUT_MS);
    } catch (error: any) {
      onFailure(signInType, error?.message, false, error);
    }
  };

  const startForegroundSignIn = () => {
    console.log(`${LOG_TAG}: Starting foreground sign in`);
    SignInCallbackHolder.setListener({
      onProgress: (type: string, code?: string) => onProgress(type, code),
      onSuccess: (type: string) => onSuccess(type),
      onFailure: (
        type: string,
        reason: string,
        isCancelled: boolean,
        error: Error | null,
      ) => onFailure(type, reason, isCancelled, error),
    });

    NavigationManager.getInstance().navigate('SignIn');
  };

  const onProgress = (signInType: string, regCode?: string) => {
    console.log('Sign-in progress, regCode:', regCode);
    sendProgress(signInType, {regcode: regCode});
    signInProgressInfo.current = {signInType, regCode: regCode ?? ''};
    checkIsSignedIn();
  };

  const onSuccess = async (signInType: string) => {
    appLifecycleAdapter.setIsSignInInProgress(false);
    console.log('Sign-in successful');
    const info = await authRepository.getUserInfo();
    checkIsSignedIn();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    sendSuccess(signInType, info?.email || '');
  };

  const onFailure = (
    signInType: string,
    reason: string,
    isCancelled: boolean,
    error: Error | null,
  ) => {
    console.log('Sign-in Failed');
    appLifecycleAdapter.setIsSignInInProgress(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    sendFailure(signInType, reason, isCancelled, error);
  };

  const initializeHomeSSO = () => {
    console.log(`${LOG_TAG}: Initializing HomeSSO`);
    enableLogging(true);
    console.log(`${LOG_TAG}: Logging enabled`);
    initialize({
      onGetSignInInfo: async () => {
        if (!appLifecycleAdapter.isAppReady()) {
          console.log(`${LOG_TAG}: App not ready, adding to pending callbacks`);
          return new Promise((resolve, reject) => {
            pendingCallbacksRef.current.push({
              resolve,
              reject,
            });
            console.log(
              `${LOG_TAG}: Total pending callbacks: ${pendingCallbacksRef.current.length}`,
            );
          });
        }
        console.log(`${LOG_TAG}: App is ready, sending sign in info`);
        const signInInfo = await sendSignInInfo();
        return signInInfo;
      },
      onStartSignIn: async (senderInfo: VizbeeSenderSignInInfo) => {
        console.log(
          `${LOG_TAG}: Received start sign in request:`,
          senderInfo,
          appLifecycleAdapter.isVideoPlaying(),
        );
        if (appLifecycleAdapter.isVideoPlaying()) {
          console.log(`${LOG_TAG}: Skipping sign in due to video playback`);
          return;
        }

        if (!appLifecycleAdapter.getIsSignInInProgress()) {
          appLifecycleAdapter.setIsSignInInProgress(true);
          signInProgressInfo.current = null;
          console.log(`${LOG_TAG}: Starting sign in process`);
          if (senderInfo.isSignedIn) {
            await startBackgroundSignIn(MVPD_SIGN_IN_TYPE);
          } else {
            startForegroundSignIn();
          }
        } else {
          console.log(
            `${LOG_TAG}: Sign in screen already open, not starting sign in process ${signInProgressInfo.current}`,
          );
          if (signInProgressInfo.current) {
            onProgress(
              signInProgressInfo.current?.signInType,
              signInProgressInfo.current?.regCode,
            );
          }
        }
      },
    });
  };

  const checkIsSignedIn = async () => {
    const isSignedIn = await authManager.isSignedIn(MVPD_SIGN_IN_TYPE);
    appLifecycleAdapter.setIsSignedIn(isSignedIn);
  };

  const stopPollingOnBackPress = () => {
    checkIsSignedIn();
    if (appLifecycleAdapter.getIsSignInInProgress()) {
      console.log('Stopping polling on back press');
      regCodePoller.stopPoll();
      appLifecycleAdapter.setIsSignInInProgress(false);
      VizbeeManager.getAppDelegate()?.deeplinkStop();
      sendFailure(MVPD_SIGN_IN_TYPE, 'User pressed back button', true, null);
    }
  };

  const signOut = async () => {
    console.log(`${LOG_TAG}: Signing out`);

    return await authRepository
      .signOut()
      .then(signOut => {
        checkIsSignedIn();
        if (signOut) {
          return Promise.resolve(true);
        } else {
          return Promise.reject(false);
        }
      })
      .catch(error => {
        console.log(`${LOG_TAG}: Sign out failed`, error);
        return Promise.reject(false);
      });
  };

  const getUserInfo = async () => {
    return authRepository.getUserInfo();
  };

  const getIsFireTv = () => {
    return authRepository.isFireTv();
  };

  console.log(`${LOG_TAG}: Home SSO adapter initialized`);

  return {
    initializeHomeSSO,
    signOut,
    getUserInfo,
    getIsFireTv,
  };
};
