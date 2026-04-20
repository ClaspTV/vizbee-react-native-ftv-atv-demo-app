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
  private appLifecycleAdapter: AppLifecycleAdapter;
  private signInCheckInterval?: NodeJS.Timeout;
  private _isFirstVideoRequest: boolean = true;
  private _isVideoInfo: VideoInfo | null = null;
  private _canUseIsFirstVideoLogic: boolean = false;

  // ── Constructor ─────────────────────────────────────────────────────────────

  constructor(appLifecycleAdapter: AppLifecycleAdapter) {
    super();
    this.isAppReady = false;
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
  }

  /**
   * Handles a video start request from Vizbee.
   * Delays execution to ensure proper sequencing.
   */
  onStartVideo(videoInfo: VideoInfo) {
    super.onStartVideo(videoInfo);

    this.deeplinkStart(videoInfo);
    this.setVideoInfo(videoInfo);
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

        // CLIENT TODO: Poll getIsSignedIn() from your authentication system here and deeplink after successful sign-in, or timeout after a reasonable period (e.g. 60s)
      },
      videoInfo,
      videoInfo.startPosition ?? 0,
    );
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
