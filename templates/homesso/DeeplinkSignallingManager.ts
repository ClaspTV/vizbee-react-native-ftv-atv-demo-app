/**
 * DeeplinkSignallingManager Template
 *
 * Manages the signaling logic for deep linking based on authentication state
 * CLIENT TODO: Update video catalog integration
 */

import {AppReadyModel} from './AppReadyModel';
import {AppLifecycleAdapter} from './AppLifecycleAdapter';
import {VideoInfo} from './Types';

interface VideoHandlerAdapterListener {
  canUseIsFirstVideoLogic(): boolean;
  isFirstVideoRequest(): boolean;
}

export class DeeplinkSignallingManager {
  private deeplinkCallback?: (appReadyModel: AppReadyModel) => void;
  private waitingForSignInCallback?: (appReadyModel: AppReadyModel) => void;

  constructor(
    private appLifecycleAdapter: AppLifecycleAdapter,
    private adapterListener: VideoHandlerAdapterListener,
  ) {
    // Initialize deeplink signalling manager
  }

  /**
   * Signals a deeplink request with callbacks for different scenarios
   */
  signalDeeplink(
    deeplinkCallback: (appReadyModel: AppReadyModel) => void,
    waitingForSignInCallback: (appReadyModel: AppReadyModel) => void,
    videoInfo: VideoInfo,
    positionMs: number,
  ) {
    // Store callbacks and initiate deeplink process
    this.deeplinkCallback = deeplinkCallback;
    this.waitingForSignInCallback = waitingForSignInCallback;
    this.performSignInChecksAndDeeplink(videoInfo, positionMs);
  }

  /**
   * Performs sign-in checks and initiates deeplink
   */
  private async performSignInChecksAndDeeplink(
    videoInfo: VideoInfo,
    positionMs: number,
  ) {
    // Wait for Home SSO to be ready before proceeding
    if (!this.appLifecycleAdapter.getIsHomeSSOReady()) {
      // Retry after delay if Home SSO is not ready
      setTimeout(() => {
        this.performSignInChecksAndDeeplink(videoInfo, positionMs);
      }, 1000);
      return;
    }

    if (this.appLifecycleAdapter.getIsSignedIn()) {
      // User is signed in, proceed directly with deeplink
      this.deeplink();
    } else {
      // User not signed in, check video requirements
      this.checkIfFirstVideoAndDeeplink(videoInfo);
    }
  }

  /**
   * Checks if this is the first video request and handles accordingly
   * CLIENT TODO: Get video authentication requirement from your system
   */
  private checkIfFirstVideoAndDeeplink(videoInfo: VideoInfo) {
    // Get video authentication requirement from video info or your system
    // CLIENT TODO: You can get this from:
    // 1. videoInfo.requiresAuthentication (if available in video metadata)
    // 2. Your video catalog/CMS system
    // 3. Your content management configuration
    // 4. Video content type or genre rules

    const isAuthVideo = videoInfo.requiresAuthentication ?? false;

    if (this.adapterListener.canUseIsFirstVideoLogic()) {
      // Check if this is the first video request in the session
      if (this.adapterListener.isFirstVideoRequest() || isAuthVideo) {
        this.doSignInProgressCheckAndDeeplink(isAuthVideo);
      } else if (!isAuthVideo) {
        // Video doesn't require authentication, deeplink directly
        this.deeplink();
      }
    } else {
      this.doSignInProgressCheckAndDeeplink(isAuthVideo);
    }
  }

  /**
   * Checks sign-in progress and handles deeplink accordingly
   */
  private doSignInProgressCheckAndDeeplink(isAuthVideo: boolean) {
    // Add delay since sign-in and start video are asynchronous operations
    setTimeout(() => {
      if (this.appLifecycleAdapter.getIsSignInInProgress() || isAuthVideo) {
        // Wait for sign-in to complete before deeplinking
        this.waitForSignInUpdateAndDeeplink();
      } else {
        // Sign-in not in progress, proceed with deeplink
        this.deeplink();
      }
    }, 1000);
  }

  /**
   * Waits for sign-in update before proceeding with deeplink
   */
  private waitForSignInUpdateAndDeeplink() {
    // Execute waiting for sign-in callback
    const appReadyModel = this.appLifecycleAdapter.getAppReadyModel();
    if (appReadyModel && this.waitingForSignInCallback) {
      this.waitingForSignInCallback(appReadyModel);
    }
  }

  /**
   * Executes the deeplink callback
   */
  private deeplink() {
    // Execute deeplink callback with app ready model
    const appReadyModel = this.appLifecycleAdapter.getAppReadyModel();
    if (appReadyModel && this.deeplinkCallback) {
      this.deeplinkCallback(appReadyModel);
    }
  }
}
