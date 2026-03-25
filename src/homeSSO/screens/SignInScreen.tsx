import React, {useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  registerCallableModule,
} from 'react-native';
import {useRoute, useNavigation} from '@react-navigation/native';
import {AuthRepository} from '../auth/AuthRepository';
import {useSignInViewModel} from './SignInViewModel';
import {SignInCallbackHolder} from '../core/SignInCallbackHolder';
import {RootStackParamList} from '../../types/Types';
import {SignInViewModel} from '../types';
import {AppLifecycleAdapter} from '../core/AppLifecycleAdapter';

interface SignInScreenProps {
  signInType: string;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({signInType}) => {
  let viewModel: SignInViewModel | null = null;
  const navigation = useNavigation();
  const authRepository = new AuthRepository();
  const route = useRoute();
  const appLifecycleAdapter = AppLifecycleAdapter.getInstance();

  const isClickNavigation =
    (route.params as RootStackParamList['SignIn'])?.isClickNavigation || false;

  if (!isClickNavigation) {
    viewModel = useSignInViewModel(authRepository, signInType);

    useEffect(() => {
      if (!viewModel) return;
      viewModel.requestCode();
      appLifecycleAdapter?.setSignInScreenExit(false);

      return () => {
        if (!viewModel) return;
        viewModel.stopPolling();
        SignInCallbackHolder.clearListener();
        appLifecycleAdapter?.setSignInScreenExit(true);
      };
    }, []);

    useEffect(() => {
      if (!viewModel) return;
      const routeCount = navigation.getState()?.routes?.length || 0;
      if (viewModel.signInState.type === 'success' && routeCount > 1) {
        navigation.goBack();
      }
    }, [viewModel.signInState, navigation]);
  } else {
    useEffect(() => {
      const interval = setInterval(async () => {
        const isSignedIn = await authRepository.isSignedIn();
        if (isSignedIn) {
          navigation.goBack();
          clearInterval(interval);
        }
      }, 1000);
      return () => clearInterval(interval);
    }, [navigation]);
  }

  return (
    <View style={styles.container}>
      {viewModel?.signInState.type === 'loading' && (
        <ActivityIndicator size="large" color="#4A90E2" />
      )}

      {(viewModel?.regCode || isClickNavigation) && (
        <Text style={styles.regCodeText}>
          Registration Code: {isClickNavigation ? 'XCVF' : viewModel!.regCode}
        </Text>
      )}

      {viewModel?.signInState.type === 'error' && (
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
