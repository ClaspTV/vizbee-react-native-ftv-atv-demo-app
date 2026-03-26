import {AppReadyModel} from './applifecycle/AppReadyModel';

// CLIENT TODO: Replace with your actual interfaces and types based on your application's needs
export interface VideoInfo {
  guid: string;
  title: string;
  isLive?: boolean;
  videoURL: string;
  imageURL?: string;
  startPosition?: number;
  requiresAuthentication?: boolean;
  customMetadata?: {[key: string]: any};
}

export interface RegCode {
  code: string;
}

export enum RegCodePollStatus {
  NOT_FOUND = 'notFound',
  IN_PROGRESS = 'inProgress',
  DONE = 'done',
  ERROR = 'error',
}

export interface RegCodePollResult {
  status: RegCodePollStatus;
  authToken?: string;
  email?: string;
  error?: string;
}

export interface VizbeeSignInStatusListener {
  onProgress: (type: string, code?: string) => void;
  onSuccess: (type: string) => void;
  onFailure: (
    type: string,
    reason: string,
    isCancelled: boolean,
    error: Error | null,
  ) => void;
}

export interface AppLifecycleListener {
  onAppReady?: (appReadyModel: AppReadyModel) => void;
  onAppUnReady?: () => void;
  onHomeSSOReadyChange?: (isReady: boolean) => void;
  onSignInProgressChange?: (inProgress: boolean) => void;
  onSignedInChange?: (isSignedIn: boolean) => void;
  onSignInScreenExitChange?: (visible: boolean) => void;
}

export interface VizbeeAppLifecycleAdapter {
  addAppLifecycleListener(listener: AppLifecycleListener): void;
  removeAppLifecycleListener(listener: AppLifecycleListener): void;
  isAppReady(): boolean;
  setAppReady(appReadyModel: AppReadyModel): void;
  clearAppReady(): void;
  getAppReadyModel(): AppReadyModel | null;
}

export type SignInState =
  | {type: 'loading'}
  | {type: 'success'}
  | {type: 'error'; message: string};

export interface SignInViewModel {
  regCode: string | null;
  signInState: SignInState;
  requestCode: () => Promise<string | undefined>;
  startPolling: (regCode: string) => void;
  stopPolling: () => void;
}
