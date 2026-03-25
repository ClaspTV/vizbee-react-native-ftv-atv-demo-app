/**
 * SignInScreen Template
 *
 * This is a template for the sign-in screen that clients should customize
 * CLIENT TODO: Implement your own UI design and navigation
 */

import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {AuthRepository} from '../auth/AuthRepository';
import {useSignInViewModel} from './useSignInViewModel';
import {SignInCallbackHolder} from './SignInCallbackHolder';
import {AppLifecycleAdapter} from '../AppLifecycleAdapter';
import {SignInViewModel} from '../Types';

interface SignInScreenProps {
  signInType: string;
  // CLIENT TODO: Add your navigation props here
  // navigation?: YourNavigationType;
  // route?: YourRouteType;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({signInType}) => {
  let viewModel: SignInViewModel | null = null;
  const authRepository = new AuthRepository();
  const appLifecycleAdapter = AppLifecycleAdapter.getInstance();

  // CLIENT TODO: Replace with your navigation solution
  // const navigation = useYourNavigation();
  // const route = useYourRoute();

  // CLIENT TODO: Replace with your route parameter handling
  const isClickNavigation = false; // Get this from your route params

  if (!isClickNavigation) {
    viewModel = useSignInViewModel(authRepository, signInType);

    useEffect(() => {
      if (!viewModel) return;

      // Start the sign-in process
      viewModel.requestCode();
      appLifecycleAdapter?.setSignInScreenExit(false);

      return () => {
        if (!viewModel) return;
        // Clean up when component unmounts
        viewModel.stopPolling();
        SignInCallbackHolder.clearListener();
        appLifecycleAdapter?.setSignInScreenExit(true);
      };
    }, []);

    useEffect(() => {
      if (!viewModel) return;

      // Handle successful sign-in by navigating back
      if (viewModel.signInState.type === 'success') {
        // CLIENT TODO: Replace with your navigation solution
        // navigation.goBack();
      }
    }, [viewModel?.signInState]);
  } else {
    // Handle click navigation (user will sign in via web/mobile)
    useEffect(() => {
      const interval = setInterval(async () => {
        const isSignedIn = await authRepository.isSignedIn();
        if (isSignedIn) {
          // CLIENT TODO: Replace with your navigation solution
          // navigation.goBack();
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }, []);
  }

  // CLIENT TODO: Customize this UI to match your app's design
  return (
    <View style={styles.container}>
      {/* Loading indicator */}
      {viewModel?.signInState.type === 'loading' && (
        <ActivityIndicator size="large" color="#4A90E2" />
      )}

      {/* Registration code display */}
      {(viewModel?.regCode || isClickNavigation) && (
        <Text style={styles.regCodeText}>
          Registration Code:{' '}
          {isClickNavigation ? 'LOADING...' : viewModel!.regCode}
        </Text>
      )}

      {/* Error message */}
      {viewModel?.signInState.type === 'error' && (
        <Text style={styles.errorText}>
          Error: {viewModel.signInState.message}
        </Text>
      )}

      {/* Instructions */}
      <Text style={styles.instructionText}>
        Please enter this code on your mobile device to complete sign-in
      </Text>

      {/* CLIENT TODO: Add your custom UI elements here */}
      {/* Examples:
        - Your app logo
        - Custom styling
        - Additional instructions
        - Custom error handling
        - Loading animations
        - Help/support links
      */}
    </View>
  );
};

// CLIENT TODO: Customize these styles to match your app's design
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a', // TODO: Use your app's background color
    padding: 16,
  },
  regCodeText: {
    color: '#FFFFFF', // TODO: Use your app's text color
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 24,
    fontFamily: 'YourCustomFont', // TODO: Use your app's font
  },
  errorText: {
    color: '#E53E3E', // TODO: Use your app's error color
    fontSize: 16,
    marginVertical: 16,
  },
  instructionText: {
    color: '#FFFFFF', // TODO: Use your app's text color
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontFamily: 'YourCustomFont', // TODO: Use your app's font
  },
});
