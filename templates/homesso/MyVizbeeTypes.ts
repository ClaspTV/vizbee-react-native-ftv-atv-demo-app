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
