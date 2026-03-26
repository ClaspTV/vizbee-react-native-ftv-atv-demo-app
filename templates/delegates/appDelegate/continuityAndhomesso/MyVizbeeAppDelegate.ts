/**
 * AppDelegate Template
 *
 * Main application delegate that handles video start requests and deep linking
 */

import {MyVizbeeDeeplinkSignallingManager as DeeplinkSignallingManager} from '../../../homesso/deeplink/MyVizbeeDeeplinkSignallingManager';
import {AppLifecycleAdapter} from '../../../homesso/applifecycle/AppLifecycleAdapter';
import {VideoInfo} from '../../../homesso/MyVizbeeTypes';
//@ts-ignore
import {VizbeeAppDelegate} from 'react-native-vizbee-receiver-sdk';

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - VideoHandlerAdapterListener
// ─────────────────────────────────────────────────────────────────────────────

interface VideoHandlerAdapterListener {
  canUseIsFirstVideoLogic(): boolean;
  isFirstVideoRequest(): boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// MARK: - MyVizbeeAppDelegate
// ─────────────────────────────────────────────────────────────────────────────

export class MyVizbeeAppDelegate
  extends VizbeeAppDelegate
  implements VideoHandlerAdapterListener
{
  // ── Instance State ──────────────────────────────────────────────────────────

  isAppReady: boolean;
  onVideoStartCallback: ((videoInfo: any) => void) | null;
  private appLifecycleAdapter: AppLifecycleAdapter;
  private signInCheckInterval?: NodeJS.Timeout;
  private _isFirstVideoRequest: boolean = true;
  private _isVideoInfo: VideoInfo | null = null;
  private _canUseIsFirstVideoLogic: boolean = false;

  // ── Constructor ─────────────────────────────────────────────────────────────

  constructor(appLifecycleAdapter: AppLifecycleAdapter) {
    super();
    this.isAppReady = false;
    this.onVideoStartCallback = null;
    this.appLifecycleAdapter = appLifecycleAdapter;
  }

  // ── VizbeeAppDelegate Overrides ─────────────────────────────────────────────

  /**
   * Handles when senders become active.
   * Resets the first video request flag.
   */
  onSendersActive() {
    super.onSendersActive();
    this._isFirstVideoRequest = true;
  }

  /**
   * Handles when senders become inactive.
   * Cleans up state and stops any pending deeplink.
   */
  onSendersInactive() {
    super.onSendersInactive();
    this._isFirstVideoRequest = false;
    this.setVideoInfo(null);
    this.deeplinkStop();
  }

  /**
   * Handles a video start request from Vizbee.
   * Delays execution to ensure proper sequencing.
   */
  onStartVideo(videoInfo: VideoInfo) {
    super.onStartVideo(videoInfo);
    setTimeout(() => {
      if (this.isAppReady && this.onVideoStartCallback) {
        this.onVideoStartCallback(videoInfo);
      }
      this.deeplinkStart(videoInfo);
      this.setVideoInfo(videoInfo);
    }, 1000);
  }

  // ── Deeplink ────────────────────────────────────────────────────────────────

  /**
   * Initiates the deeplink process for the given video.
   * Handles both authenticated and unauthenticated flows,
   * polling for sign-in completion with a 60s timeout.
   */
  deeplinkStart(videoInfo: VideoInfo) {
    const deeplinkSignallingManager = new DeeplinkSignallingManager(
      this.appLifecycleAdapter,
      this,
    );

    deeplinkSignallingManager.signalDeeplink(
      async appReadyModel => {
        // Authenticated (or auth-free) — proceed immediately
        this._isFirstVideoRequest = false;
        this.setVideoInfo(null);
        appReadyModel.deeplinkManager.deeplinkVideo(
          videoInfo,
          videoInfo.startPosition ?? 0,
        );
        this.appLifecycleAdapter.setIsVideoPlaying(true);
      },
      async appReadyModel => {
        // Awaiting sign-in — send a fake failure and poll until signed in
        appReadyModel.deeplinkManager.sendFakeDeeplinkFailure(videoInfo);

        let elapsedTime = 0;

        if (this.signInCheckInterval) {
          clearInterval(this.signInCheckInterval);
        }

        this.signInCheckInterval = setInterval(() => {
          elapsedTime += 1000;

          if (this.appLifecycleAdapter.getIsSignedIn()) {
            clearInterval(this.signInCheckInterval);
            appReadyModel.deeplinkManager.deeplinkVideo(
              videoInfo,
              videoInfo.startPosition ?? 0,
            );
            this.appLifecycleAdapter.setIsVideoPlaying(true);
            return;
          }

          if (elapsedTime > 60000) {
            clearInterval(this.signInCheckInterval);
            this.signInCheckInterval = undefined;
          }
        }, 1000);
      },
      videoInfo,
      0,
    );
  }

  /**
   * Stops any active deeplink flow and clears the sign-in polling interval.
   * Re-attempts deeplink if the video does not require authentication.
   */
  deeplinkStop() {
    if (this.signInCheckInterval) {
      clearInterval(this.signInCheckInterval);
      this.signInCheckInterval = undefined;
      this.checkIfNeedToDeeplink();
      this.setVideoInfo(null);
    }
  }

  /**
   * Re-starts deeplink if the stored video does not require authentication
   * and no video is currently playing.
   *
   * CLIENT TODO: Resolve `videoRequiresAuthentication` from one of:
   *   1. videoInfo.requiresAuthentication (if present in video metadata)
   *   2. Your video catalog / CMS system
   *   3. Your content management configuration
   *   4. Video content type or genre rules
   */
  private checkIfNeedToDeeplink() {
    if (!this._isVideoInfo) {
      return;
    }

    const videoRequiresAuthentication =
      this._isVideoInfo.requiresAuthentication ?? false;

    if (
      !videoRequiresAuthentication &&
      !this.appLifecycleAdapter.isVideoPlaying()
    ) {
      this.deeplinkStart(this._isVideoInfo);
    }
  }

  // ── State Accessors ─────────────────────────────────────────────────────────

  /**
   * Stores the current video info.
   */
  setVideoInfo(videoInfo: VideoInfo | null) {
    this._isVideoInfo = videoInfo;
  }

  /**
   * Updates app-ready state. Clears sign-in polling if app becomes unready.
   */
  setIsAppReady(isAppReady: boolean) {
    this.isAppReady = isAppReady;
    if (!isAppReady && this.signInCheckInterval) {
      clearInterval(this.signInCheckInterval);
      this.signInCheckInterval = undefined;
    }
  }

  /**
   * Registers a callback to be invoked on each video start event.
   */
  setOnVideoStartCallback(callback: ((videoInfo: any) => void) | null) {
    this.onVideoStartCallback = callback;
  }

  // ── VideoHandlerAdapterListener Implementation ──────────────────────────────

  canUseIsFirstVideoLogic(): boolean {
    return this.getCanUseIsFirstVideoLogic();
  }

  isFirstVideoRequest(): boolean {
    return this._isFirstVideoRequest;
  }

  setCanUseIsFirstVideoLogic(value: boolean): void {
    this._canUseIsFirstVideoLogic = value;
  }

  getCanUseIsFirstVideoLogic(): boolean {
    return this._canUseIsFirstVideoLogic;
  }
}
