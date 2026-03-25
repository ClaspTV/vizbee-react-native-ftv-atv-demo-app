import {useEffect, useRef} from 'react';
import {useVizbeeHomeSSOReceiver} from 'react-native-vizbee-homesso-receiver-sdk';
import {MvpdRegCodePoller} from '../core/MvpdRegCodePoller';
import {AuthRepository} from '../auth/AuthRepository';
import {AuthManager} from '../auth/AuthManager';
import {SignInCallbackHolder} from '../core/SignInCallbackHolder';
import {AppLifecycleListener} from '../types';
import {
  VizbeeSenderSignInInfo,
  VizbeeSignInInfo,
} from 'react-native-vizbee-homesso-receiver-sdk';
// @ts-ignore
import {VizbeeManager} from 'react-native-vizbee-receiver-sdk';
import NavigationManager from '../../utils/NavigationManager';
import {AppReadyModel} from '../core/AppReadyModel';
import {MVPD_SIGN_IN_TYPE, SIGN_IN_TIMEOUT_MS} from '../constants/constants';
import VideoEvents from '../../utils/VideoEvents';
import {AppLifecycleAdapter} from '../core/AppLifecycleAdapter';

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
  const signInProgressInfo = useRef<{[key: string]: any} | null>(null);

  useEffect(() => {
    const listener: AppLifecycleListener = {
      onAppReady: async (appReadyModel: AppReadyModel) => {
        appLifecycleAdapter.setIsHomeSSOReady(true);
        checkIsSignedIn();

        if (pendingCallbacksRef.current.length > 0) {
          const callbacksToExecute = pendingCallbacksRef.current;
          try {
            const signInInfo = await sendSignInInfo();
            for (const callback of callbacksToExecute) {
              callback.resolve(signInInfo);
            }
          } catch (error) {
            for (const callback of callbacksToExecute) {
              callback.reject(error);
            }
          }
          pendingCallbacksRef.current = [];
        }
      },
      onAppUnReady: () => {
        appLifecycleAdapter.setIsHomeSSOReady(false);
      },
      onSignInScreenExitChange: visible => {
        if (visible) {
          stopPollingOnBackPress();
        }
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
      appLifecycleAdapter?.setIsVideoPlaying(false);
    });

    return unsubscribe;
  }, []);

  const sendSignInInfo = async () => {
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
    return [mvpdSignInInfo];
  };

  const startBackgroundSignIn = async (signInType: string) => {
    try {
      const code = await regCodePoller.requestCode();
      onProgress(signInType, code);

      regCodePoller.startPoll(code);

      regCodePoller.setOnCheckDoneChangeListener(isDone => {
        if (isDone) {
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
    } catch (error) {
      const err = error as Error;
      onFailure(signInType, err?.message, false, err);
    }
  };

  const startForegroundSignIn = () => {
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
    sendProgress(signInType, {regcode: regCode});
    signInProgressInfo.current = {signInType, regCode};
    checkIsSignedIn();
  };

  const onSuccess = async (signInType: string) => {
    appLifecycleAdapter.setIsSignInInProgress(false);
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
    appLifecycleAdapter.setIsSignInInProgress(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    sendFailure(signInType, reason, isCancelled, error);
  };

  const initializeHomeSSO = () => {
    enableLogging(true);
    initialize({
      onGetSignInInfo: async () => {
        if (!appLifecycleAdapter.isAppReady()) {
          return new Promise((resolve, reject) => {
            pendingCallbacksRef.current.push({
              resolve,
              reject,
            });
          });
        }
        const signInInfo = await sendSignInInfo();
        return signInInfo;
      },
      onStartSignIn: async (senderInfo: VizbeeSenderSignInInfo) => {
        if (appLifecycleAdapter.isVideoPlaying()) {
          return;
        }

        if (!appLifecycleAdapter.getIsSignInInProgress()) {
          appLifecycleAdapter.setIsSignInInProgress(true);
          signInProgressInfo.current = null;
          if (senderInfo.isSignedIn) {
            await startBackgroundSignIn(MVPD_SIGN_IN_TYPE);
          } else {
            startForegroundSignIn();
          }
        } else {
          onProgress(
            signInProgressInfo.current?.signInType,
            signInProgressInfo.current?.regCode,
          );
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
      regCodePoller.stopPoll();
      appLifecycleAdapter.setIsSignInInProgress(false);
      VizbeeManager.getAppDelegate()?.deeplinkStop();
      sendFailure(MVPD_SIGN_IN_TYPE, 'User pressed back button', true, null);
    }
  };

  const signOut = async () => {
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
        return Promise.reject(false);
      });
  };

  const getUserInfo = async () => {
    return authRepository.getUserInfo();
  };

  const getIsFireTv = () => {
    return authRepository.isFireTv();
  };

  return {
    initializeHomeSSO,
    signOut,
    getUserInfo,
    getIsFireTv,
  };
};
