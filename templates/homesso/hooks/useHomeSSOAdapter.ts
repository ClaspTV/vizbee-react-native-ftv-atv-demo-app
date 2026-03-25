/**
 * Home SSO Adapter Hook Template
 *
 * Main hook that orchestrates the Home SSO functionality
 * CLIENT TODO: Replace navigation implementation
 */

import {useEffect, useRef} from 'react';
import {useVizbeeHomeSSOReceiver} from 'react-native-vizbee-homesso-receiver-sdk';
import {MvpdRegCodePoller} from '../poller/implementation/MvpdRegCodePoller';
import {AuthRepository} from '../auth/AuthRepository';
import {AuthManager} from '../auth/AuthManager';
import {SignInCallbackHolder} from '../signin/SignInCallbackHolder';
import {AppLifecycleListener} from '../Types';
import {
  VizbeeSenderSignInInfo,
  VizbeeSignInInfo,
} from 'react-native-vizbee-homesso-receiver-sdk';
import {AppLifecycleAdapter} from '../AppLifecycleAdapter';
import {AppReadyModel} from '../AppReadyModel';
import {SIGN_IN_TYPE, SIGN_IN_TIMEOUT_MS} from '../constants';
// TODO: Replace with your video events system
import VideoEvents from '../VideoEvents';

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
    {resolve: (value: any) => void; reject: (error: any) => void}[]
  >([]);
  const signInProgressInfo = useRef<{[key: string]: any} | null>(null);

  useEffect(() => {
    // Set up app lifecycle listener for handling app ready/unready states
    const listener: AppLifecycleListener = {
      onAppReady: async (appReadyModel: AppReadyModel) => {
        // App is ready, enable Home SSO and check sign-in status
        appLifecycleAdapter.setIsHomeSSOReady(true);
        checkIsSignedIn();

        // Handle any pending callbacks waiting for app ready
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
        // App is not ready, disable Home SSO
        appLifecycleAdapter.setIsHomeSSOReady(false);
      },
      onSignInScreenExitChange: visible => {
        // Handle sign-in screen exit events
        if (visible) {
          stopPollingOnBackPress();
        }
      },
    };

    appLifecycleAdapter.addAppLifecycleListener(listener);
    appLifecycleAdapter.setAppReady(appReadyModelRef);

    return () => {
      // Clean up listeners
      appLifecycleAdapter.clearAppReady();
      appLifecycleAdapter.removeAppLifecycleListener(listener);
    };
  }, []);

  // Subscribe to video events
  useEffect(() => {
    const unsubscribe = VideoEvents.onVideoStopped(() => {
      // Handle video stopped event
      appLifecycleAdapter?.setIsVideoPlaying(false);
    });

    return unsubscribe;
  }, [appLifecycleAdapter]);

  /**
   * Sends current sign-in information to Vizbee
   */
  const sendSignInInfo = async () => {
    // Get current sign-in status and user info
    const signedIn = await authManager.isSignedIn(SIGN_IN_TYPE);
    const info = await authRepository.getUserInfo();

    const mvpdSignInInfo: VizbeeSignInInfo = {
      signInType: SIGN_IN_TYPE,
      isSignedIn: signedIn,
    };

    // Include user details if signed in
    if (signedIn && info) {
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

  /**
   * Starts background sign-in process (automatic polling)
   */
  const startBackgroundSignIn = async (signInType: string) => {
    try {
      // Request registration code and start polling
      const code = await regCodePoller.requestCode();
      onProgress(signInType, code);

      regCodePoller.startPoll(code);

      // Set up completion listener
      regCodePoller.setOnCheckDoneChangeListener(isDone => {
        if (isDone) {
          onSuccess(signInType);
        }
      });

      // Set timeout for sign-in process
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

  /**
   * Starts foreground sign-in process (show UI to user)
   * CLIENT TODO: Replace navigation implementation
   */
  const startForegroundSignIn = () => {
    // Set up callback handlers for the sign-in screen
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

    // CLIENT TODO: Replace with your navigation implementation
    // Navigate to your sign-in screen
    /*
    Example implementations:
    - React Navigation: navigation.navigate('SignIn')
    - React Router: navigate('/signin')
    */
  };

  /**
   * Handles sign-in progress updates
   */
  const onProgress = (signInType: string, regCode?: string) => {
    // Send progress update to Vizbee and store current state
    sendProgress(signInType, {regcode: regCode});
    signInProgressInfo.current = {signInType, regCode};
    checkIsSignedIn();
  };

  /**
   * Handles successful sign-in
   */
  const onSuccess = async (signInType: string) => {
    // Clean up sign-in state and send success notification
    appLifecycleAdapter.setIsSignInInProgress(false);
    const info = await authRepository.getUserInfo();
    checkIsSignedIn();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    sendSuccess(signInType, info?.email || '');
  };

  /**
   * Handles sign-in failure
   */
  const onFailure = (
    signInType: string,
    reason: string,
    isCancelled: boolean,
    error: Error | null,
  ) => {
    // Clean up sign-in state and send failure notification
    appLifecycleAdapter.setIsSignInInProgress(false);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    sendFailure(signInType, reason, isCancelled, error);
  };

  /**
   * Initializes the Home SSO system
   */
  const initializeHomeSSO = () => {
    // Enable logging and initialize Vizbee Home SSO
    enableLogging(true);

    initialize({
      onGetSignInInfo: async () => {
        if (!appLifecycleAdapter.isAppReady()) {
          // App not ready, queue callback for later execution
          return new Promise((resolve, reject) => {
            pendingCallbacksRef.current.push({resolve, reject});
          });
        }
        const signInInfo = await sendSignInInfo();
        return signInInfo;
      },
      onStartSignIn: async (senderInfo: VizbeeSenderSignInInfo) => {
        // Handle sign-in start request from sender

        // Skip if video is currently playing
        if (appLifecycleAdapter.isVideoPlaying()) {
          return;
        }

        if (!appLifecycleAdapter.getIsSignInInProgress()) {
          // Start new sign-in process
          appLifecycleAdapter.setIsSignInInProgress(true);
          signInProgressInfo.current = null;

          if (senderInfo.isSignedIn) {
            // Sender is signed in, do background sign-in
            await startBackgroundSignIn(SIGN_IN_TYPE);
          } else {
            // Sender not signed in, show sign-in UI
            startForegroundSignIn();
          }
        } else {
          // Sign-in already in progress, send current progress
          onProgress(
            signInProgressInfo.current?.signInType,
            signInProgressInfo.current?.regCode,
          );
        }
      },
    });
  };

  /**
   * Checks and updates current sign-in status
   */
  const checkIsSignedIn = async () => {
    // Check current sign-in status and update adapter
    const isSignedIn = await authManager.isSignedIn(SIGN_IN_TYPE);
    appLifecycleAdapter.setIsSignedIn(isSignedIn);
  };

  /**
   * Stops polling when user presses back button
   */
  const stopPollingOnBackPress = () => {
    checkIsSignedIn();
    if (appLifecycleAdapter.getIsSignInInProgress()) {
      // Stop polling and clean up sign-in state
      regCodePoller.stopPoll();
      appLifecycleAdapter.setIsSignInInProgress(false);
      // CLIENT TODO: Import VizbeeManager and uncomment when needed
      // import { VizbeeManager } from 'react-native-vizbee-receiver-sdk';
      // VizbeeManager.getAppDelegate()?.deeplinkStop();
      sendFailure(SIGN_IN_TYPE, 'User pressed back button', true, null);
    }
  };

  /**
   * Signs out the current user
   */
  const signOut = async () => {
    // Attempt to sign out and update sign-in status
    return await authRepository
      .signOut()
      .then(signOut => {
        checkIsSignedIn();
        return signOut ? Promise.resolve(true) : Promise.reject(false);
      })
      .catch(error => {
        return Promise.reject(false);
      });
  };

  /**
   * Gets current user information
   */
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
