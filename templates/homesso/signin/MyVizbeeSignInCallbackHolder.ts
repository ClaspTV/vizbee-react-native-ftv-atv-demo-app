/**
 * SignInCallbackHolder
 *
 * Manages sign-in callback listeners for communication between components
 */

import {VizbeeSignInStatusListener} from '../MyVizbeeTypes';

class MyVizbeeSignInCallbackHolder {
  private static listener: VizbeeSignInStatusListener | null = null;

  public static setListener(newListener: VizbeeSignInStatusListener): void {
    // Set the current sign-in callback listener
    MyVizbeeSignInCallbackHolder.listener = newListener;
  }

  public static getListener(): VizbeeSignInStatusListener | null {
    return MyVizbeeSignInCallbackHolder.listener;
  }

  public static clearListener(): void {
    // Clear the current sign-in callback listener
    MyVizbeeSignInCallbackHolder.listener = null;
  }
}

export {MyVizbeeSignInCallbackHolder};
