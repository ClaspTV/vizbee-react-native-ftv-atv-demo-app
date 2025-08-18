/**
 * AppDelegate Template
 *
 * Main application delegate that handles video start requests and deep linking
 */

import {DeeplinkSignallingManager} from '../../../homesso/DeeplinkSignallingManager';
import {AppLifecycleAdapter} from '../../../homesso/AppLifecycleAdapter';
import {VideoInfo} from '../../../homesso/Types';
//@ts-ignore
import {VizbeeAppDelegate} from 'react-native-vizbee-receiver-sdk';

interface VideoHandlerAdapterListener {
  canUseIsFirstVideoLogic(): boolean;
  isFirstVideoRequest(): boolean;
}

export class MyAppVizbeeAppDelegate
  extends VizbeeAppDelegate
  implements VideoHandlerAdapterListener
{
  isAppReady: boolean;
  onVideoStartCallback: ((videoInfo: any) => void) | null;
  private appLifecycleAdapter: AppLifecycleAdapter;
  private signInCheckInterval?: NodeJS.Timeout;
  private _isFirstVideoRequest: boolean = true;
  private _isVideoInfo: VideoInfo | null = null;
  private _canUseIsFirstVideoLogic: boolean = false;

  constructor(appLifecycleAdapter: AppLifecycleAdapter) {
    super();

    // Initialize app delegate with lifecycle adapter
    this.isAppReady = false;
    this.onVideoStartCallback = null;
    this.appLifecycleAdapter = appLifecycleAdapter;
  }

  /**
   * Handles video start requests from Vizbee
   */
  onStartVideo(videoInfo: VideoInfo) {
    super.onStartVideo(videoInfo);

    // Handle video start request with delay to ensure proper sequencing
    setTimeout(() => {
      if (this.isAppReady && this.onVideoStartCallback) {
        this.onVideoStartCallback(videoInfo);
      }
      this.deeplinkStart(videoInfo);
      this.setVideoInfo(videoInfo);
    }, 1000);
  }

  /**
   * Sets the current video info
   */
  setVideoInfo(videoInfo: VideoInfo | null) {
    // Store current video info for later reference
    this._isVideoInfo = videoInfo;
  }

  /**
   * Starts the deeplink process for a video
   */
  deeplinkStart(videoInfo: VideoInfo) {
    // Initialize and configure deeplink signalling manager
    const deeplinkSignallingManager = new DeeplinkSignallingManager(
      this.appLifecycleAdapter,
      this,
    );

    deeplinkSignallingManager.signalDeeplink(
      async appReadyModel => {
        // Successful deeplink callback - user is authenticated or video doesn't require auth
        this._isFirstVideoRequest = false;
        this.setVideoInfo(null);
        appReadyModel.deeplinkManager.deeplinkVideo(
          videoInfo,
          videoInfo.startPosition ?? 0,
        );
        this.appLifecycleAdapter.setIsVideoPlaying(true);
      },
      async appReadyModel => {
        // Waiting for sign-in callback - user needs to authenticate
        appReadyModel.deeplinkManager.sendFakeDeeplinkFailure(videoInfo);

        let elapsedTime = 0;

        // Clear any existing sign-in check interval
        if (this.signInCheckInterval) {
          clearInterval(this.signInCheckInterval);
        }

        // Start periodic checking for sign-in completion
        this.signInCheckInterval = setInterval(() => {
          elapsedTime += 1000;

          if (this.appLifecycleAdapter.getIsSignedIn()) {
            // User has signed in, proceed with deeplink
            clearInterval(this.signInCheckInterval);
            appReadyModel.deeplinkManager.deeplinkVideo(
              videoInfo,
              videoInfo.startPosition ?? 0,
            );
            this.appLifecycleAdapter.setIsVideoPlaying(true);
            return;
          }

          // Stop checking after 60 seconds timeout
          if (elapsedTime > 60000) {
            clearInterval(this.signInCheckInterval);
            this.signInCheckInterval = undefined;
            return;
          }
        }, 1000);
      },
      videoInfo,
      0,
    );
  }

  /**
   * Handles when senders become active
   */
  onSendersActive() {
    super.onSendersActive();

    // Reset first video request flag when senders become active
    this._isFirstVideoRequest = true;
  }

  /**
   * Handles when senders become inactive
   */
  onSendersInactive() {
    super.onSendersInactive();

    // Clean up state when senders become inactive
    this._isFirstVideoRequest = false;
    this.setVideoInfo(null);
    this.deeplinkStop();
  }

  /**
   * Sets the video start callback
   */
  setOnVideoStartCallback(callback: ((videoInfo: any) => void) | null) {
    // Set callback for video start events
    this.onVideoStartCallback = callback;
  }

  /**
   * Sets the app ready state
   */
  setIsAppReady(isAppReady: boolean) {
    // Update app ready state and clean up if becoming unready
    this.isAppReady = isAppReady;
    if (!isAppReady && this.signInCheckInterval) {
      // Clear sign-in check interval when app becomes unready
      clearInterval(this.signInCheckInterval);
      this.signInCheckInterval = undefined;
    }
  }

  /**
   * Stops the deeplink process
   */
  deeplinkStop() {
    if (this.signInCheckInterval) {
      // Stop sign-in checking and clean up state
      clearInterval(this.signInCheckInterval);
      this.signInCheckInterval = undefined;

      this.checkIfNeedToDeeplink();
      this.setVideoInfo(null);
    }
  }

  /**
   * Checks if deeplink is needed after stopping
   * CLIENT TODO: Get video authentication requirement from your system
   */
  checkIfNeedToDeeplink() {
    if (!this._isVideoInfo) {
      // No video info available, cannot proceed with deeplink
      return;
    }

    // Get video authentication requirement from video info or your system
    // CLIENT TODO: You can get this from:
    // 1. videoInfo.requiresAuthentication (if available in video metadata)
    // 2. Your video catalog/CMS system
    // 3. Your content management configuration
    // 4. Video content type or genre rules
    const videoRequiresAuthentication =
      this._isVideoInfo.requiresAuthentication ?? false;

    // Re-start deeplink if video doesn't require auth and no video is playing
    if (
      !videoRequiresAuthentication &&
      !this.appLifecycleAdapter.isVideoPlaying()
    ) {
      this.deeplinkStart(this._isVideoInfo);
    }
  }

  // VideoHandlerAdapterListener implementation
  canUseIsFirstVideoLogic(): boolean {
    return this.getCanUseIsFirstVideoLogic();
  }

  setCanUseIsFirstVideoLogic(value: boolean): void {
    // Configure whether to use first video logic based on device if not firetv
    this._canUseIsFirstVideoLogic = value;
  }

  getCanUseIsFirstVideoLogic(): boolean {
    return this._canUseIsFirstVideoLogic;
  }

  isFirstVideoRequest(): boolean {
    return this._isFirstVideoRequest;
  }
}
