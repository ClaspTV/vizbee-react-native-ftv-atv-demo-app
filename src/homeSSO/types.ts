import { AppReadyModel } from "./core/AppReadyModel";

export interface VideoInfo {
  guid: string;
  title: string;
  videoURL: string;
  imageURL: string;
  isLive: boolean;
  startPosition?: number;
  requiresAuthentication?: boolean;
  customMetadata?: {
    streamType?: string;
    [key: string]: any;
  };
}

export interface AppLifecycleListener {
  onAppReady?: (appReadyModel: AppReadyModel) => void;
  onAppUnReady?: () => void;
  onHomeSSOReadyChange?: (isReady: boolean) => void;
  onSignInProgressChange?: (inProgress: boolean) => void;
  onSignedInChange?: (isSignedIn: boolean | null) => void;
  onSignInScreenExitChange?: (visible: boolean) => void;
}

export interface VizbeeAppLifecycleAdapter {
  addAppLifecycleListener: (listener: AppLifecycleListener) => void;
  removeAppLifecycleListener(listener: AppLifecycleListener): void;
  isAppReady: () => boolean;
  setAppReady: (appReadyModel: AppReadyModel) => void;
  clearAppReady: () => void;
  getAppReadyModel: () => AppReadyModel | null;
  getIsHomeSSOReady: () => boolean;
  setIsHomeSSOReady: (value: boolean) => void;
  getIsSignInInProgress: () => boolean;
  setIsSignInInProgress: (value: boolean) => void;
  getIsSignedIn: () => boolean | null;
  setIsSignedIn: (value: boolean | null) => void;
  getSignInScreenExit: () => boolean;
  setSignInScreenExit: (value: boolean) => void;
}

export interface RegCode {
  code: string;
}

export enum RegCodePollStatus {
  NOT_FOUND = "NOT_FOUND",
  IN_PROGRESS = "IN_PROGRESS",
  DONE = "DONE",
  ERROR = "ERROR",
}

export interface RegCodePollResult {
  status: RegCodePollStatus;
  authToken?: string;
  email?: string;
  error?: string;
}

export interface VizbeeSenderSignInInfo {
  isSignedIn: boolean;
}

export interface VizbeeSignInInfo {
  signInType: string;
  isSignedIn: boolean;
  userLogin: string;
}

export type SignInState =
  | { type: "loading" }
  | { type: "success" }
  | { type: "error"; message: string };

export interface SignInViewModel {
  regCode: string | null;
  signInState: SignInState;
  requestCode: () => Promise<string>;
  startPolling: (regCode: string | null) => void;
  stopPolling: () => void;
}

export interface VizbeeSignInStatusListener {
  onProgress: (signInType: string, regCode?: string) => void;
  onSuccess: (signInType: string) => void;
  onFailure: (
    signInType: string,
    reason: string,
    isCancelled: boolean,
    error: Error | null
  ) => void;
}
