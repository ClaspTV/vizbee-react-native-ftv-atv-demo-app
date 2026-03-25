import { AppReadyModel } from "../core/AppReadyModel";
import { AppLifecycleListener, VizbeeAppLifecycleAdapter } from "../types";

export class AppLifecycleAdapter implements VizbeeAppLifecycleAdapter {
  private appReadyModel: AppReadyModel | null = null;
  private videoPlaying: boolean = false;
  private appLifecycleListeners: AppLifecycleListener[] = [];

  // Added state properties
  private _isHomeSSOReady: boolean = false;
  private _isSignInInProgress: boolean = false;
  private _isSignedIn: boolean | null = null;
  private _isVideoPlaying: boolean = false;

  private static instance: AppLifecycleAdapter | null = null;

  // Private constructor prevents direct instantiation
  private constructor() {}

  static getInstance(): AppLifecycleAdapter {
    if (!AppLifecycleAdapter.instance) {
      AppLifecycleAdapter.instance = new AppLifecycleAdapter();
    }
    return AppLifecycleAdapter.instance;
  }

  addAppLifecycleListener(listener: AppLifecycleListener): void {
    this.appLifecycleListeners.push(listener);
  }

  removeAppLifecycleListener(listener: AppLifecycleListener): void {
    const index = this.appLifecycleListeners.indexOf(listener);
    if (index !== -1) {
      this.appLifecycleListeners.splice(index, 1);
    }
  }

  isAppReady(): boolean {
    return this.appReadyModel !== null;
  }

  setAppReady(appReadyModel: AppReadyModel): void {
    console.log("Setting app ready with model:", appReadyModel);
    const isDuplicate = this.isAppReady();
    this.appReadyModel = appReadyModel;

    if (!isDuplicate) {
      this.appLifecycleListeners.forEach((listener) => {
        if (listener.onAppReady) {
          listener.onAppReady(appReadyModel);
        }
      });
    } else {
      console.log("IGNORE_DUP_APP_READY");
    }
  }

  clearAppReady(): void {
    this.appReadyModel = null;
    this.appLifecycleListeners.forEach((listener) => {
      if (listener.onAppUnReady) {
        listener.onAppUnReady();
      }
    });
  }

  getAppReadyModel(): AppReadyModel | null {
    return this.appReadyModel;
  }

  getIsHomeSSOReady(): boolean {
    return this._isHomeSSOReady;
  }

  setIsHomeSSOReady(value: boolean): void {
    if (this._isHomeSSOReady !== value) {
      this._isHomeSSOReady = value;
      this.appLifecycleListeners.forEach((listener) => {
        if (listener.onHomeSSOReadyChange) {
          listener.onHomeSSOReadyChange(value);
        }
      });
    }
  }

  getIsSignInInProgress(): boolean {
    return this._isSignInInProgress;
  }

  setIsSignInInProgress(value: boolean): void {
    console.log(
      "Setting isSignInInProgress to:",
      value,
      this._isSignInInProgress !== value,
    );
    if (this._isSignInInProgress !== value) {
      this._isSignInInProgress = value;
      this.appLifecycleListeners.forEach((listener) => {
        if (listener.onSignInProgressChange) {
          listener.onSignInProgressChange(value);
        }
      });
    }
  }

  getIsSignedIn(): boolean | null {
    return this._isSignedIn;
  }

  setIsSignedIn(value: boolean | null): void {
    console.log("Setting isSignedIn to:", value);
    if (this._isSignedIn !== value) {
      this._isSignedIn = value;
      this.appLifecycleListeners.forEach((listener) => {
        if (listener.onSignedInChange) {
          listener.onSignedInChange(value);
        }
      });
    }
  }

  getSignInScreenExit(): boolean {
    return this.videoPlaying;
  }

  setSignInScreenExit(value: boolean): void {
    this.videoPlaying = value;
    this.appLifecycleListeners.forEach((listener) => {
      if (listener.onSignInScreenExitChange) {
        listener.onSignInScreenExitChange(value);
      }
    });
  }

  setIsVideoPlaying(videoPlaying: boolean) {
    console.log("Setting setWasVideoPlayingOnTV to:", videoPlaying);
    // set the video playing state to false after a delay to ensure the switch case works correctly
    setTimeout(() => {
      this._isVideoPlaying = videoPlaying;
    }, 1000);
  }

  isVideoPlaying(): boolean {
    return this._isVideoPlaying;
  }
}
