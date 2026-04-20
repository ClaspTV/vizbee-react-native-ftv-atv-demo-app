// @ts-ignore
import {VizbeeAppDelegate} from 'react-native-vizbee-receiver-sdk';
import {AppReadyModel} from './AppReadyModel';
import {AppLifecycleAdapter} from './AppLifecycleAdapter';
import {VideoInfo} from '../types';
import {videos} from '../../data/VideoCatalog';

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
    this.appLifecycleAdapter = appLifecycleAdapter;
    this.adapterListener = adapterListener;
  }

  signalDeeplink(
    deeplinkCallback: (appReadyModel: AppReadyModel) => void,
    waitingForSignInCallback: (appReadyModel: AppReadyModel) => void,
    videoInfo: VideoInfo,
    positionMs: number,
  ) {
    this.deeplinkCallback = deeplinkCallback;
    this.waitingForSignInCallback = waitingForSignInCallback;
    this.performSignInChecksAndDeeplink(videoInfo, positionMs);
  }

  private async performSignInChecksAndDeeplink(
    videoInfo: VideoInfo,
    positionMs: number,
  ) {
    if (!this.appLifecycleAdapter.getIsHomeSSOReady()) {
      setTimeout(() => {
        console.log('HomeSSO not ready, retrying deeplink');
        this.performSignInChecksAndDeeplink(videoInfo, positionMs);
      }, 1000);
      return;
    }

    if (this.appLifecycleAdapter.getIsSignedIn()) {
      console.log('User is signed in, proceeding with deeplink');
      this.deeplink();
    } else {
      this.checkIfFirstVideoAndDeeplink(videoInfo);
    }
  }

  private checkIfFirstVideoAndDeeplink(videoInfo: VideoInfo) {
    const isAuthVideo =
      videos.find(video => video.guid === videoInfo.guid)
        ?.requiresAuthentication ?? false;

    if (this.adapterListener.canUseIsFirstVideoLogic()) {
      // Checking if the start video request received for first time in app sender connected session
      console.log(
        'Checking if first video request, isFirstVideoRequest:',
        this.adapterListener.isFirstVideoRequest(),
      );
      if (this.adapterListener.isFirstVideoRequest() || isAuthVideo) {
        this.doSignInProgressCheckAndDeeplink(isAuthVideo);
      } else if (!isAuthVideo) {
        // If the video does not require authentication, we can deeplink directly
        this.deeplink();
      }
    } else {
      this.doSignInProgressCheckAndDeeplink(isAuthVideo);
    }
  }

  private doSignInProgressCheckAndDeeplink(isAuthVideo: boolean) {
    // If the sign in is in progress or the video requires authentication,
    // we will wait for the sign in to complete before deeplinking
    // added delay since sign in and start video are asynchronous operations
    setTimeout(() => {
      console.log(
        'videoRequiresAuthentication:',
        isAuthVideo,
        this.appLifecycleAdapter.getIsSignInInProgress(),
      );
      if (this.appLifecycleAdapter.getIsSignInInProgress() || isAuthVideo) {
        this.waitForSignInUpdateAndDeeplink();
      } else {
        console.log('Sign in not in progress, proceeding with deeplink');
        // If the sign in is not in progress and the video does not require authentication, we can deeplink directly
        this.deeplink();
      }
    }, 1000);
  }

  private waitForSignInUpdateAndDeeplink() {
    console.log('Waiting for sign in to complete');
    const appReadyModel = this.appLifecycleAdapter.getAppReadyModel();
    if (appReadyModel && this.waitingForSignInCallback) {
      console.log('Waiting for sign in with appReadyModel');
      this.waitingForSignInCallback(appReadyModel);
    }
  }

  private deeplink() {
    console.log('Deeplinking');
    const appReadyModel = this.appLifecycleAdapter.getAppReadyModel();
    if (appReadyModel && this.deeplinkCallback) {
      console.log('Deeplinking with appReadyModel');
      this.deeplinkCallback(appReadyModel);
    }
  }
}

export class AppDelegate
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
    this.isAppReady = false;
    this.onVideoStartCallback = null;
    this.appLifecycleAdapter = appLifecycleAdapter;
  }

  onStartVideo(videoInfo: VideoInfo) {
    super.onStartVideo(videoInfo);
    console.log('onStartVideo called with videoInfo:', videoInfo);
    // Adding a delay so that senders active is called before this method
    setTimeout(() => {
      if (this.isAppReady && this.onVideoStartCallback) {
        this.onVideoStartCallback(videoInfo);
      }
      this.deeplinkStart(videoInfo);
      this.setVideoInfo(videoInfo);
    }, 1000);
  }

  setVideoInfo(videoInfo: VideoInfo | null) {
    console.log('Setting video info:', videoInfo);
    this._isVideoInfo = videoInfo;
  }

  deeplinkStart(videoInfo: VideoInfo) {
    const deeplinkSignallingManager = new DeeplinkSignallingManager(
      this.appLifecycleAdapter,
      this,
    );

    deeplinkSignallingManager.signalDeeplink(
      async appReadyModel => {
        this._isFirstVideoRequest = false;
        this.setVideoInfo(null);
        appReadyModel.deeplinkManager.deeplinkVideo(
          videoInfo,
          videoInfo.startPosition ?? 0,
        );
        this.appLifecycleAdapter.setIsVideoPlaying(true);
      },
      async appReadyModel => {
        appReadyModel.deeplinkManager.sendFakeDeeplinkFailure(videoInfo);

        console.log('Mobile is not signed in, starting sign in check interval');
        let elapsedTime = 0;

        if (this.signInCheckInterval) {
          clearInterval(this.signInCheckInterval);
        }

        this.signInCheckInterval = setInterval(() => {
          elapsedTime += 1000;
          console.log(`Checking sign in state at ${elapsedTime / 1000}s`);
          // Get requiresAuthentication from your video catalog
          const videoInfoRequiresAuthentication =
            videoInfo.requiresAuthentication || false;
          console.log(
            'Checking sign in state, requiresAuthentication:',
            videoInfoRequiresAuthentication,
            'elapsedTime:',
            elapsedTime,
            'isSignedIn:',
            this.appLifecycleAdapter.getIsSignedIn(),
            'isSignInInProgress:',
            this.appLifecycleAdapter.getIsSignInInProgress(),
          );
          if (this.appLifecycleAdapter.getIsSignedIn()) {
            console.log('Local user is signed in, triggering deeplink');
            clearInterval(this.signInCheckInterval);
            appReadyModel.deeplinkManager.deeplinkVideo(
              videoInfo,
              videoInfo.startPosition ?? 0,
            );
            this.appLifecycleAdapter.setIsVideoPlaying(true);
            return;
          }
          // if elapsedTime is greater than 60 seconds   user is not signed in, clear the interval
          if (elapsedTime > 60000) {
            console.log('Sign in check interval exceeded 60 seconds, stopping');
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

  onSendersActive() {
    super.onSendersActive();
    console.log('Senders active');
    this._isFirstVideoRequest = true;
  }

  onSendersInactive() {
    super.onSendersInactive();
    this._isFirstVideoRequest = false;
    this.setVideoInfo(null);
    this.deeplinkStop();
  }

  setOnVideoStartCallback(callback: ((videoInfo: any) => void) | null) {
    this.onVideoStartCallback = callback;
  }

  setIsAppReady(isAppReady: boolean) {
    this.isAppReady = isAppReady;
    if (!isAppReady && this.signInCheckInterval) {
      console.log('Clearing sign in check interval as app became unready');
      clearInterval(this.signInCheckInterval);
      this.signInCheckInterval = undefined;
    }
  }

  deeplinkStop() {
    if (this.signInCheckInterval) {
      console.log('Clearing sign in check interval');
      clearInterval(this.signInCheckInterval);
      this.signInCheckInterval = undefined;

      this.checkIfNeedToDeeplink();
      this.setVideoInfo(null);
    }
  }

  checkIfNeedToDeeplink() {
    if (!this._isVideoInfo) {
      console.log('No video info available, cannot deeplink');
      return;
    }
    const videoRequiresAuthentication =
      videos.find(
        (video: VideoInfo | undefined) =>
          video?.guid === this._isVideoInfo?.guid,
      )?.requiresAuthentication ?? false;
    // If the video does not require authentication, we can deeplink directly
    console.log(
      'Checking if need to deeplink, videoRequiresAuthentication:',
      videoRequiresAuthentication,
      'isVideoPlaying:',
      this.appLifecycleAdapter.isVideoPlaying(),
    );
    if (
      !videoRequiresAuthentication &&
      !this.appLifecycleAdapter.isVideoPlaying()
    ) {
      this.deeplinkStart(this._isVideoInfo);
    }
  }

  canUseIsFirstVideoLogic(): boolean {
    return this.getCanUseIsFirstVideoLogic();
  }

  setCanUseIsFirstVideoLogic(value: boolean): void {
    this._canUseIsFirstVideoLogic = value;
  }

  getCanUseIsFirstVideoLogic(): boolean {
    return this._canUseIsFirstVideoLogic;
  }

  isFirstVideoRequest(): boolean {
    return this._isFirstVideoRequest;
  }
}
