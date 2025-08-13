/**
 * useSignInViewModel Hook Template
 *
 * React hook for managing sign-in screen state and logic
 */

import {useState, useEffect, useCallback, useRef} from 'react';
import {AuthRepository} from '../auth/AuthRepository';
import {MvpdRegCodePoller} from '../poller/implementation/MvpdRegCodePoller';
import {SignInState, SignInViewModel} from '../../Types';
import {SignInCallbackHolder} from './SignInCallbackHolder';

export function useSignInViewModel(
  authRepository: AuthRepository,
  signInType: string,
): SignInViewModel {
  const [signInState, setSignInState] = useState<SignInState>({
    type: 'loading',
  });
  const [regCode, setRegCode] = useState<string | null>(null);
  const regCodePoller = useRef(new MvpdRegCodePoller(authRepository));
  const isCheckDoneListenerSet = useRef(false);

  useEffect(() => {
    const onload = async () => {
      await checkIsSignedIn();

      if (!isCheckDoneListenerSet.current) {
        // Set up listener for polling completion
        regCodePoller.current.setOnCheckDoneChangeListener(isDone => {
          if (isDone) {
            // Notify callback holder of successful sign-in
            SignInCallbackHolder.getListener()?.onSuccess(signInType);
            setSignInState({type: 'success'});
          }
        });

        // Set up listener for registration code changes
        regCodePoller.current.setOnRegCodeChangeListener(code => {
          setRegCode(code);
          startPolling(code);
        });

        isCheckDoneListenerSet.current = true;
      }
    };

    onload();

    return () => {
      // Clean up listeners when component unmounts
      regCodePoller.current.removeListeners();
    };
  }, [signInType]);

  /**
   * Checks current sign-in status
   */
  const checkIsSignedIn = useCallback(async () => {
    // Check if user is already signed in
    const isSignedIn = await authRepository.isSignedIn();
    if (isSignedIn) {
      setSignInState({type: 'success'});
    } else {
      setSignInState({type: 'loading'});
    }
  }, []);

  /**
   * Requests a new registration code
   */
  const requestCode = useCallback(async () => {
    try {
      // Request new registration code from server
      setSignInState({type: 'loading'});
      const code = await regCodePoller.current.requestCode();
      // Notify callback holder of progress
      SignInCallbackHolder.getListener()?.onProgress(signInType, code);
      return code;
    } catch (error) {
      // Handle code request error
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setSignInState({type: 'error', message: errorMessage});
      SignInCallbackHolder.getListener()?.onFailure(
        signInType,
        errorMessage,
        false,
        null,
      );
    }
  }, [signInType]);

  /**
   * Starts polling for registration code status
   */
  const startPolling = useCallback(
    (regCode: string) => {
      // Start polling for registration code status
      setSignInState({type: 'loading'});

      if (regCode) {
        regCodePoller.current.startPoll(regCode);
      }
    },
    [regCode],
  );

  /**
   * Stops polling for registration code status
   */
  const stopPolling = useCallback(() => {
    // Stop registration code polling
    regCodePoller.current.stopPoll();
  }, []);

  return {
    regCode,
    signInState,
    requestCode,
    startPolling,
    stopPolling,
  };
}
