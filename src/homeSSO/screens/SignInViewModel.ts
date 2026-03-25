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

  useEffect(() => {
    const onload = async () => {
      await checkIsSignedIn();
      if (!isCheckDoneListenerSet.current) {
        regCodePoller.current.setOnCheckDoneChangeListener(isDone => {
          if (isDone) {
            SignInCallbackHolder.getListener()?.onSuccess(signInType);
            setSignInState({type: 'success'});
          }
        });

        regCodePoller.current.setOnRegCodeChangeListener(code => {
          setRegCode(code);
          startPolling(code);
        });

        isCheckDoneListenerSet.current = true;
      }
    };
    onload();
    return () => {
      regCodePoller.current.removeListeners();
    };
  }, [signInType]);

  const checkIsSignedIn = useCallback(async () => {
    const isSignedIn = await authRepository.isSignedIn();
    if (isSignedIn) {
      setSignInState({type: 'success'});
    } else {
      setSignInState({type: 'loading'});
    }
  }, []);

  const requestCode = useCallback(async () => {
    try {
      setSignInState({type: 'loading'});
      const code = await regCodePoller.current.requestCode();
      SignInCallbackHolder.getListener()?.onProgress(signInType, code);

      return code;
    } catch (error) {
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

  const startPolling = (regCode: string) => {
    setSignInState({type: 'loading'});

    if (regCode) {
      regCodePoller.current.startPoll(regCode);
    }
  };

  const stopPolling = () => {
    regCodePoller.current.stopPoll();
  };

  return {
    regCode,
    signInState,
    requestCode,
    startPolling,
    stopPolling,
  };
}
