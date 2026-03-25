/**
 * SignInCallbackHolder
 *
 * Manages sign-in callback listeners for communication between components
 */

import {VizbeeSignInStatusListener} from '../Types';

class SignInCallbackHolder {
  private static listener: VizbeeSignInStatusListener | null = null;

  public static setListener(newListener: VizbeeSignInStatusListener): void {
    // Set the current sign-in callback listener
    SignInCallbackHolder.listener = newListener;
  }

  public static getListener(): VizbeeSignInStatusListener | null {
    return SignInCallbackHolder.listener;
  }

  public static clearListener(): void {
    // Clear the current sign-in callback listener
    SignInCallbackHolder.listener = null;
  }
}

export {SignInCallbackHolder};
