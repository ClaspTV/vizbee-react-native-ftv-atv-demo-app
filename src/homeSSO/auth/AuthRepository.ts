import AsyncStorage from '@react-native-async-storage/async-storage';
import DeviceInfo from 'react-native-device-info';
import {Platform} from 'react-native';
import {RegCode, RegCodePollResult, RegCodePollStatus} from '../types';

export class AuthRepository {
  private apiBaseUrl: string = 'https://homesso.vizbee.tv';

  private async getDeviceId(): Promise<string> {
    const deviceId = await DeviceInfo.getUniqueId();
    const prefix = (await this.isFireTv()) ? 'firetv' : 'androidtv';
    console.log('prefix =', prefix, 'deviceId =', deviceId);
    return `${prefix}:${deviceId}`;
  }

  async isFireTv(): Promise<boolean> {
    if (Platform.OS !== 'android') return false;
    const model = await DeviceInfo.getModel();
    const hasFireTvFeature = await DeviceInfo.hasSystemFeature(
      'amazon.hardware.fire_tv',
    );
    return model.startsWith('AFT') || hasFireTvFeature;
  }

  async fetchAccountRegCode(): Promise<RegCode> {
    try {
      const deviceId = await this.getDeviceId();
      const jsonBody = JSON.stringify({deviceId});
      console.log('fetchAccountRegCode request body:', jsonBody);

      const response = await fetch(`${this.apiBaseUrl}/v1/accountregcode`, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
        },
        body: jsonBody,
      });

      console.log('fetchAccountRegCode response:', response);

      if (!response.ok) {
        throw new Error(`Failed to fetch account reg code: ${response.status}`);
      }

      const responseText = await response.text();
      console.log('fetchAccountRegCode response body:', responseText);

      const jsonResponse = JSON.parse(responseText);
      const code = jsonResponse.code;

      console.log(
        'fetchAccountRegCode response:',
        response,
        'jsonResponse:',
        jsonResponse,
        'deviceId:',
        deviceId,
        'requestBody =',
        jsonBody,
      );

      return {code};
    } catch (error) {
      console.error('Error fetching reg code:', error);
      throw error;
    }
  }

  async pollForRegCodeStatus(
    regCode: string,
    callback: (result: RegCodePollResult) => boolean,
    pollingInterval: number = 2000,
    shouldContinuePolling: () => boolean = () => true, // Add this parameter
  ): Promise<void> {
    console.log(
      'Polling for reg code:',
      regCode,
      'status with interval:',
      pollingInterval,
    );

    let isDone = false;

    while (!isDone && shouldContinuePolling()) {
      // Check shouldContinuePolling
      try {
        const deviceId = await this.getDeviceId();
        const jsonBody = JSON.stringify({
          deviceId,
          regCode,
        });

        console.log('Poll request body:', jsonBody);

        const response = await fetch(
          `${this.apiBaseUrl}/v1/accountregcode/poll?seed=${
            Math.floor(Math.random() * 100000000) + 1
          }`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'text/plain',
            },
            body: jsonBody,
          },
        );

        // If polling was stopped, break immediately
        if (!shouldContinuePolling()) {
          console.log('Polling stopped, breaking loop');
          break;
        }

        console.log('Poll response:', response);

        if (!response.ok) {
          throw new Error(`Poll request failed: ${response.status}`);
        }

        const responseText = await response.text();
        const jsonResponse = JSON.parse(responseText);
        console.log('Poll json response:', jsonResponse);
        const result = await this.processRegCodePollResponse(jsonResponse);
        console.log('Poll request result:', result);

        isDone = callback(result);

        if (!isDone && shouldContinuePolling()) {
          await new Promise(resolve => setTimeout(resolve, pollingInterval));
        }
        console.log('Polling for reg code loop: isDone =', isDone);
      } catch (error: any) {
        console.error('Poll request failed:', error);
        const errorResult = {
          status: RegCodePollStatus.ERROR,
          error: error?.message,
        };
        isDone = callback(errorResult);
      }
    }
  }

  private async processRegCodePollResponse(
    jsonResponse: any,
  ): Promise<RegCodePollResult> {
    const status = jsonResponse.status;

    if (status === 'notFound') {
      return {status: RegCodePollStatus.NOT_FOUND};
    }

    if (jsonResponse.authToken) {
      const authToken = jsonResponse.authToken;
      const email = jsonResponse.email;

      await AsyncStorage.multiSet([
        ['authToken', authToken],
        ['email', email],
      ]);

      return {
        status: RegCodePollStatus.DONE,
        authToken,
        email,
      };
    }

    return {status: RegCodePollStatus.IN_PROGRESS};
  }

  async signOut(): Promise<boolean> {
    try {
      const authToken = await AsyncStorage.getItem('authToken');
      const response = await fetch(`${this.apiBaseUrl}/v1/signout`, {
        method: 'POST',
        headers: {
          Authorization: authToken || '',
        },
      });

      if (response.ok) {
        const responseText = await response.text();
        const jsonResponse = JSON.parse(responseText);
        console.log('Sign out successful, clearing AsyncStorage', jsonResponse);
        await AsyncStorage.multiRemove(['authToken', 'email']);
        return Promise.resolve(true);
      }
      return Promise.resolve(false);
    } catch (error) {
      console.error('Sign out failed:', error);
      return Promise.resolve(false);
    }
  }

  async isSignedIn(): Promise<boolean> {
    const authToken = await AsyncStorage.getItem('authToken');
    return !!authToken;
  }

  async getUserInfo(): Promise<any | null> {
    try {
      const email = await AsyncStorage.getItem('email');
      if (email) {
        return {email};
      } else {
        return null;
      }
    } catch {
      return null;
    }
  }
}
