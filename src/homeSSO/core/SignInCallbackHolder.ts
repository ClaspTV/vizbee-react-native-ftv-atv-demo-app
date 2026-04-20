import { VizbeeSignInStatusListener } from "../types";

class SignInCallbackHolder {
  private static listener: VizbeeSignInStatusListener | null = null;

  public static setListener(newListener: VizbeeSignInStatusListener): void {
    SignInCallbackHolder.listener = newListener;
  }

  public static getListener(): VizbeeSignInStatusListener | null {
    return SignInCallbackHolder.listener;
  }

  public static clearListener(): void {
    SignInCallbackHolder.listener = null;
  }
}

export { SignInCallbackHolder };
