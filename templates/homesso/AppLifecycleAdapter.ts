/**
 * AppLifecycleAdapter
 *
 * Manages application lifecycle state and notifies listeners
 */

import React from 'react';
import {AppReadyModel} from './AppReadyModel';
import {AppLifecycleListener, VizbeeAppLifecycleAdapter} from './Types';

export class AppLifecycleAdapter implements VizbeeAppLifecycleAdapter {
  private appReadyModel: AppReadyModel | null = null;
  private videoPlaying: boolean = false;
  private appLifecycleListeners: AppLifecycleListener[] = [];

  // State properties
  private _isHomeSSOReady: boolean = false;
  private _isSignInInProgress: boolean = false;
  private _isSignedIn: boolean = false;
  private _isVideoPlaying: boolean = false;

  constructor() {
    // Initialize app lifecycle adapter
  }

  addAppLifecycleListener(listener: AppLifecycleListener): void {
    // Add new lifecycle listener to the collection
    this.appLifecycleListeners.push(listener);
  }

  removeAppLifecycleListener(listener: AppLifecycleListener): void {
    // Remove lifecycle listener from the collection
    const index = this.appLifecycleListeners.indexOf(listener);
    if (index !== -1) {
      this.appLifecycleListeners.splice(index, 1);
    }
  }

  isAppReady(): boolean {
    return this.appReadyModel !== null;
  }

  setAppReady(appReadyModel: AppReadyModel): void {
    // Set app ready model and notify listeners (avoid duplicates)
    const isDuplicate = this.isAppReady();
    this.appReadyModel = appReadyModel;

    if (!isDuplicate) {
      // Notify all listeners that app is ready
      this.appLifecycleListeners.forEach(listener => {
        if (listener.onAppReady) {
          listener.onAppReady(appReadyModel);
        }
      });
    }
  }

  clearAppReady(): void {
    // Clear app ready state and notify listeners
    this.appReadyModel = null;
    this.appLifecycleListeners.forEach(listener => {
      if (listener.onAppUnReady) {
        listener.onAppUnReady();
      }
    });
  }

  getAppReadyModel(): AppReadyModel | null {
    return this.appReadyModel;
  }

  // Home SSO Ready State
  getIsHomeSSOReady(): boolean {
    return this._isHomeSSOReady;
  }

  setIsHomeSSOReady(value: boolean): void {
    if (this._isHomeSSOReady !== value) {
      // Update Home SSO ready status and notify listeners
      this._isHomeSSOReady = value;
      this.appLifecycleListeners.forEach(listener => {
        if (listener.onHomeSSOReadyChange) {
          listener.onHomeSSOReadyChange(value);
        }
      });
    }
  }

  // Sign In Progress State
  getIsSignInInProgress(): boolean {
    return this._isSignInInProgress;
  }

  setIsSignInInProgress(value: boolean): void {
    if (this._isSignInInProgress !== value) {
      // Update sign-in progress status and notify listeners
      this._isSignInInProgress = value;
      this.appLifecycleListeners.forEach(listener => {
        if (listener.onSignInProgressChange) {
          listener.onSignInProgressChange(value);
        }
      });
    }
  }

  // Signed In State
  getIsSignedIn(): boolean {
    return this._isSignedIn;
  }

  setIsSignedIn(value: boolean): void {
    if (this._isSignedIn !== value) {
      // Update signed-in status and notify listeners
      this._isSignedIn = value;
      this.appLifecycleListeners.forEach(listener => {
        if (listener.onSignedInChange && value !== null) {
          listener.onSignedInChange(value);
        }
      });
    }
  }

  // Sign In Screen Exit State
  getSignInScreenExit(): boolean {
    return this.videoPlaying;
  }

  setSignInScreenExit(value: boolean): void {
    // Update sign-in screen exit status and notify listeners
    this.videoPlaying = value;
    this.appLifecycleListeners.forEach(listener => {
      if (listener.onSignInScreenExitChange) {
        listener.onSignInScreenExitChange(value);
      }
    });
  }

  // Video Playing State
  setIsVideoPlaying(videoPlaying: boolean) {
    // Set video playing state with delay for proper state management
    setTimeout(() => {
      this._isVideoPlaying = videoPlaying;
    }, 1000);
  }

  isVideoPlaying(): boolean {
    return this._isVideoPlaying;
  }
}

/**
 * React Hook for AppLifecycleAdapter
 */
export function useAppLifecycle() {
  const adapter = React.useMemo(() => new AppLifecycleAdapter(), []);

  React.useEffect(() => {
    return () => {
      adapter.clearAppReady();
    };
  }, [adapter]);

  return adapter;
}
