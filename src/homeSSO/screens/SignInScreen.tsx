import React, {useEffect} from 'react';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {AuthRepository} from '../auth/AuthRepository';
import {useSignInViewModel} from './SignInViewModel';
import {SignInCallbackHolder} from '../core/SignInCallbackHolder';
import {RootStackParamList} from '../../types/Types';
import {AppLifecycleAdapter} from '../core/AppLifecycleAdapter';

interface SignInScreenProps {
  signInType: string;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({signInType}) => {
  const appLifecycleAdapter = AppLifecycleAdapter.getInstance();
  const navigation = useNavigation();
  const authRepository = new AuthRepository();
  const route = useRoute();

  const isClickNavigation =
    (route.params as RootStackParamList['SignIn'])?.isClickNavigation || false;

  const viewModel = useSignInViewModel(authRepository, signInType);

  useEffect(() => {
    if (isClickNavigation) return;
    viewModel.requestCode();
    appLifecycleAdapter?.setSignInScreenExit(false);
    return () => {
      viewModel.stopPolling();
      SignInCallbackHolder.clearListener();
      appLifecycleAdapter?.setSignInScreenExit(true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isClickNavigation) return;
    const navigationState = navigation.getState();
    if (
      viewModel.signInState.type === 'success' &&
      navigationState &&
      navigationState?.routes?.length > 1
    ) {
      console.log('Sign-in successful, navigating back');
      navigation.goBack();
    }
  }, [viewModel.signInState, navigation, isClickNavigation]);

  useEffect(() => {
    if (!isClickNavigation) return;
    const interval = setInterval(async () => {
      const isSignedIn = await authRepository.isSignedIn();
      if (isSignedIn) {
        navigation.goBack();
        clearInterval(interval);
      } else {
        console.log('Still waiting for sign-in via click navigation');
      }
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigation, isClickNavigation]);

  return (
    <View style={styles.container}>
      {!isClickNavigation && viewModel.signInState.type === 'loading' && (
        <ActivityIndicator size="large" color="#4A90E2" />
      )}

      {(viewModel.regCode || isClickNavigation) && (
        <Text style={styles.regCodeText}>
          Registration Code: {isClickNavigation ? 'XCVF' : viewModel.regCode}
        </Text>
      )}

      {!isClickNavigation && viewModel.signInState.type === 'error' && (
        <Text style={styles.errorText}>
          Error: {viewModel.signInState.message}
        </Text>
      )}

      <Text style={styles.instructionText}>
        Please enter this code on your mobile device to complete sign-in
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 16,
  },
  regCodeText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginVertical: 24,
  },
  errorText: {
    color: '#E53E3E',
    fontSize: 16,
    marginVertical: 16,
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
  },
});
