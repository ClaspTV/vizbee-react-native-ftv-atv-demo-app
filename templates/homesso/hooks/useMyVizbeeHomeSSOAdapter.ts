/**
 * Home SSO Adapter Hook Template
 *
 * Main hook that orchestrates the Home SSO functionality
 * CLIENT TODO: Replace navigation implementation
 */

import {useEffect, useRef} from 'react';
import {MyVizbeeAuthManager as AuthManager} from '../auth/MyVizbeeAuthManager';
import {AppLifecycleListener} from '../MyVizbeeTypes';
import {
  useVizbeeHomeSSOReceiver,
  //@ts-ignore
} from 'react-native-vizbee-homesso-receiver-sdk';
import {
  VizbeeSenderSignInInfo,
  VizbeeSignInInfo,
  //@ts-ignore
} from 'react-native-vizbee-homesso-receiver-sdk';
import {AppLifecycleAdapter} from '../applifecycle/AppLifecycleAdapter';
import {AppReadyModel} from '../applifecycle/AppReadyModel';
import {SIGN_IN_TYPE} from '../auth/MyVizbeeAuthManager';

export const useMyVizbeeHomeSSOAdapter = () => {
  const {initialize, sendProgress, sendSuccess, sendFailure, enableLogging} =
    useVizbeeHomeSSOReceiver();
  const appLifecycleAdapter = AppLifecycleAdapter.getInstance();

  const appReadyModelRef = useRef(new AppReadyModel()).current;

  const authManager = useRef(new AuthManager()).current;
  const pendingCallbacksRef = useRef<
    {resolve: (value: any) => void; reject: (error: any) => void}[]
  >([]);

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

  /**
   * Sends current sign-in information to Vizbee
   */
  const sendSignInInfo = async () => {
    // Get current sign-in status and user info
    const signedIn = await authManager.isSignedIn(SIGN_IN_TYPE);

    const mvpdSignInInfo: VizbeeSignInInfo = {
      signInType: SIGN_IN_TYPE,
      isSignedIn: signedIn,
    };

    // Include user details if signed in
    if (signedIn) {
      // CLIENT TODO: Replace with actual user info retrieval
      // mvpdSignInInfo['userLogin'] = info?.email;
      // mvpdSignInInfo['userName'] = `name:${info?.email || ''}`;
      // mvpdSignInInfo['userSubscriptionType'] = 'subscriptionType-1';
      // mvpdSignInInfo['userSubscriptionValue'] = 'subscriptionValue-1';
      // mvpdSignInInfo['userSubscriptionRenewalType'] = 'monthly';
      // mvpdSignInInfo['userAdditionalInfo'] = {
      //   customKey1: 'customValue1',
      //   customKey2: 'customValue2',
      // };
    }

    return [mvpdSignInInfo];
  };

  /**
   * Starts background sign-in process (automatic polling)
   * CLIENT TODO: Start polling for registration code and handle sign-in flow based on your authentication system. Make sure to call onProgress, onSuccess, and onFailure callbacks based on the polling results and user actions.
   * Also you can add timeout for the polling process and call onFailure callback if polling exceeds the timeout duration.
   */
  const startBackgroundSignIn = async (signInType: string) => {
    // Request registration code and start polling
  };

  /**
   * Starts foreground sign-in process (show UI to user)
   * CLIENT TODO: Replace navigation implementation and ensure your sign-in screen calls the provided callbacks
   */
  const startForegroundSignIn = () => {
    // CLIENT TODO: Replace with your navigation implementation
    // Navigate to your sign-in screen
    /*
    Example implementations:
    - React Navigation: navigation.navigate('SignIn')
    - React Router: navigate('/signin')
    - The sign in screen should call onProgress, onSuccess, and onFailure callbacks based on user actions and sign-in results
    */
  };

  /**
   * Handles sign-in progress updates
   */
  const onProgress = (signInType: string, regCode?: string) => {
    // Send progress update to Vizbee and store current state
    sendProgress(signInType, {regcode: regCode});
  };

  /**
   * Handles successful sign-in
   */
  const onSuccess = async (signInType: string) => {
    // Clean up sign-in state and send success notification
    appLifecycleAdapter.setIsSignInInProgress(false);
    const email = ''; // CLIENT TODO: Replace with actual user email if available
    sendSuccess(signInType, email);
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

          if (senderInfo.isSignedIn) {
            // Sender is signed in, do background sign-in
            await startBackgroundSignIn(SIGN_IN_TYPE);
          } else {
            // Sender not signed in, show sign-in UI
            startForegroundSignIn();
          }
        } else {
          // Sign-in already in progress, send current progress
          // CLIENT TODO: send sign-type and regcode with onProgress callback
          // onProgress('<signInType>', '<regCode>');
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
      appLifecycleAdapter.setIsSignInInProgress(false);
      // CLIENT TODO: Import VizbeeManager and uncomment when needed
      // Stop polling and clean up sign-in state

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
  };

  /**
   * Gets current user information
   */
  const getUserInfo = async () => {
    // CLIENT TODO: Replace with actual user info retrieval logic
    return {};
  };

  const getIsFireTv = () => {
    // CLIENT TODO: Implement logic to determine if the device is Fire TV
    return false;
  };

  return {
    initializeHomeSSO,
    signOut,
    getUserInfo,
    getIsFireTv,
  };
};
