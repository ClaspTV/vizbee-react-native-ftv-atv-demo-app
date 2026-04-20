import {useState, useEffect, useCallback, useRef} from 'react';
import {AuthRepository} from '../auth/AuthRepository';
import {MvpdRegCodePoller} from '../core/MvpdRegCodePoller';
import {SignInState, SignInViewModel} from '../types';
import {SignInCallbackHolder} from '../core/SignInCallbackHolder';

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

  const checkIsSignedIn = useCallback(async () => {
    const isSignedIn = await authRepository.isSignedIn();
    if (isSignedIn) {
      setSignInState({type: 'success'});
    } else {
      setSignInState({type: 'loading'});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const poller = regCodePoller.current;
    const onload = async () => {
      await checkIsSignedIn();
      console.log(
        'Setting up listeners for reg code polling',
        !isCheckDoneListenerSet.current,
      );
      if (!isCheckDoneListenerSet.current) {
        poller.setOnCheckDoneChangeListener(isDone => {
          if (isDone) {
            console.log(
              'Sign in successful',
              SignInCallbackHolder.getListener(),
            );
            SignInCallbackHolder.getListener()?.onSuccess(signInType);
            setSignInState({type: 'success'});
          }
        });

        poller.setOnRegCodeChangeListener(code => {
          console.log('Received new reg code:', code);
          setRegCode(code);
          startPolling(code);
        });

        isCheckDoneListenerSet.current = true;
      }
    };
    onload();
    return () => {
      poller.removeListeners();
    };
  }, [signInType, checkIsSignedIn]);

  const requestCode = useCallback(async () => {
    try {
      setSignInState({type: 'loading'});
      const code = await regCodePoller.current.requestCode();
      console.log('Received code:', code, SignInCallbackHolder.getListener());
      SignInCallbackHolder.getListener()?.onProgress(signInType, code);

      return code;
    } catch (error: any) {
      console.error('Error requesting code:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      setSignInState({type: 'error', message: errorMessage});
      SignInCallbackHolder.getListener()?.onFailure(
        signInType,
        error?.message ?? '',
        false,
        null,
      );
      return '';
    }
  }, [signInType]);

  const startPolling = (newRegCode: string | null) => {
    setSignInState({type: 'loading'});
    console.log('Starting polling with code:', newRegCode);

    if (newRegCode) {
      regCodePoller.current.startPoll(newRegCode);
    } else {
      console.log('Code is null, waiting for it to be set');
    }
  };

  const stopPolling = useCallback(() => {
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
