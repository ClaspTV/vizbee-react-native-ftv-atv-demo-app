/**
 * AuthRepository Template
 *
 * This template shows you how to implement the authentication repository.
 * Replace the placeholder implementations with your actual authentication logic.
 *
 * DEPENDENCIES YOU NEED TO IMPLEMENT:
 * - Device info retrieval
 * - Storage solution
 * - Network requests
 */

import {RegCode, RegCodePollResult, RegCodePollStatus} from '../MyVizbeeTypes';

export class MyVizbeeAuthRepository {
  private apiBaseUrl: string = 'https://homesso.vizbee.tv';

  /**
   * CLIENT TODO: Implement device ID generation
   * Replace this implementation with your platform-specific device ID logic
   */
  private async getDeviceId(): Promise<string> {
    // TODO: Replace with your device info implementation
    // Examples:
    // - For React Native: Use react-native-device-info
    // - For React: Use browser APIs or device fingerprinting
    // - For TV platforms: Use platform-specific device identifiers

    const deviceId = 'YOUR_DEVICE_ID_HERE'; // TODO: Get actual device ID
    const isFireTv = await this.isFireTv();
    const prefix = isFireTv ? 'firetv' : 'androidtv';

    return `${prefix}:${deviceId}`;
  }

  /**
   * CLIENT TODO: Implement Fire TV detection
   * Return true if this is a Fire TV device, false otherwise
   */
  async isFireTv(): Promise<boolean> {
    // TODO: Replace with your Fire TV detection logic
    // Examples:
    // - Check if device model starts with 'AFT'
    // - Check for amazon.hardware.fire_tv system feature
    // - Check manufacturer is 'Amazon'

    return false; // TODO: Implement actual detection
  }

  /**
   * Fetches registration code from server
   * CLIENT TODO: Implement the HTTP request using your preferred networking library
   */
  async fetchAccountRegCode(): Promise<RegCode> {
    try {
      const deviceId = await this.getDeviceId();
      const requestBody = JSON.stringify({deviceId});

      // TODO: Replace this with your HTTP client implementation
      // Expected API call:
      // POST https://homesso.vizbee.tv/v1/accountregcode
      // Headers: { 'Content-Type': 'text/plain' }
      // Body: { "deviceId": "your-device-id" }
      // Expected response: { "code": "ABC123" }

      /*
      Example implementations:
      
      const response = await fetch(`${this.apiBaseUrl}/v1/accountregcode`, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: requestBody
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch account reg code: ${response.status}`);
      }
      
      const jsonResponse = await response.json();
      return { code: jsonResponse.code };
      */

      throw new Error(
        'CLIENT TODO: Implement fetchAccountRegCode HTTP request',
      );
    } catch (error) {
      throw error;
    }
  }

  /**
   * Polls for registration code status
   * CLIENT TODO: Implement the HTTP polling request
   */
  async pollForRegCodeStatus(
    regCode: string,
    callback: (result: RegCodePollResult) => boolean,
    pollingInterval: number = 2000,
    shouldContinuePolling: () => boolean = () => true,
  ): Promise<void> {
    let isDone = false;

    while (!isDone && shouldContinuePolling()) {
      try {
        const deviceId = await this.getDeviceId();
        const requestBody = JSON.stringify({deviceId, regCode});

        // TODO: Replace this with your HTTP client implementation
        // Expected API call:
        // POST https://homesso.vizbee.tv/v1/accountregcode/poll?seed={random}
        // Headers: { 'Content-Type': 'text/plain' }
        // Body: { "deviceId": "your-device-id", "regCode": "ABC123" }
        // Expected responses:
        // - { "status": "notFound" } - user hasn't entered code yet
        // - { "status": "inProgress" } - user entered code, processing
        // - { "authToken": "token", "email": "user@email.com" } - success

        /*
        Example implementation:
        
        const seed = Math.floor(Math.random() * (100000000 - 1 + 1)) + 1;
        const response = await fetch(
          `${this.apiBaseUrl}/v1/accountregcode/poll?seed=${seed}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
            body: requestBody
          }
        );
        
        if (!response.ok) {
          throw new Error(`Poll request failed: ${response.status}`);
        }
        
        const jsonResponse = await response.json();
        const result = await this.processRegCodePollResponse(jsonResponse);
        isDone = callback(result);
        */

        // CLIENT TODO: Remove this mock implementation
        await new Promise(resolve => setTimeout(resolve, pollingInterval));
        const mockResult = {status: RegCodePollStatus.IN_PROGRESS};
        isDone = callback(mockResult);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        const errorResult = {
          status: RegCodePollStatus.ERROR,
          error: err.message,
        };
        isDone = callback(errorResult);
      }
    }
  }

  /**
   * Processes the polling response from server
   * This method handles the server response and manages local storage
   */
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

      // CLIENT TODO: Replace with your storage solution
      // Store the authToken and email for future use
      /*
      Example implementations:
      - React Native: await AsyncStorage.multiSet([['authToken', authToken], ['email', email]])
      - React: localStorage.setItem('authToken', authToken); localStorage.setItem('email', email)
      */

      return {
        status: RegCodePollStatus.DONE,
        authToken,
        email,
      };
    }

    return {status: RegCodePollStatus.IN_PROGRESS};
  }

  /**
   * Signs out the user
   * CLIENT TODO: Implement sign out HTTP request and storage cleanup
   */
  async signOut(): Promise<boolean> {
    try {
      // CLIENT TODO: Get auth token from your storage
      const authToken = 'YOUR_STORED_AUTH_TOKEN'; // TODO: Get from storage

      // TODO: Replace with your HTTP client implementation
      // Expected API call:
      // POST https://homesso.vizbee.tv/v1/signout
      // Headers: { 'Authorization': 'your-auth-token' }

      /*
      Example implementation:
      
      const response = await fetch(`${this.apiBaseUrl}/v1/signout`, {
        method: 'POST',
        headers: { Authorization: authToken || '' }
      });
      
      if (response.ok) {
        // Clear stored authentication data
        // React Native: await AsyncStorage.multiRemove(['authToken', 'email']);
        // React: localStorage.removeItem('authToken'); localStorage.removeItem('email');
        return true;
      }
      */

      return false;
    } catch (error) {
      return false;
    }
  }

  /**
   * Checks if user is currently signed in
   * CLIENT TODO: Replace with your storage solution
   */
  async isSignedIn(): Promise<boolean> {
    // TODO: Replace with your storage implementation
    // Check if auth token exists in storage
    /*
    Example implementations:
    - React Native: const authToken = await AsyncStorage.getItem('authToken'); return !!authToken;
    - React: const authToken = localStorage.getItem('authToken'); return !!authToken;
    */

    return false; // TODO: Return actual signed-in status
  }

  /**
   * Gets stored user information
   * CLIENT TODO: Replace with your storage solution
   */
  async getUserInfo(): Promise<any | null> {
    try {
      // TODO: Replace with your storage implementation
      /*
      Example implementations:
      - React Native: const email = await AsyncStorage.getItem('email'); return email ? {email} : null;
      - React: const email = localStorage.getItem('email'); return email ? {email} : null;
      */

      return null; // TODO: Return actual user info
    } catch (error) {
      return null;
    }
  }
}
