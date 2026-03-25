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
        this.performSignInChecksAndDeeplink(videoInfo, positionMs);
      }, 1000);
      return;
    }

    if (this.appLifecycleAdapter.getIsSignedIn()) {
      this.deeplink();
    } else {
      this.checkIfFirstVideoAndDeeplink(videoInfo);
    }
  }

  private checkIfFirstVideoAndDeeplink(videoInfo: VideoInfo) {
    const foundVideo = videos.find(video => video.guid == videoInfo.guid);
    const isAuthVideo = foundVideo?.requiresAuthentication ?? false;

    if (this.adapterListener.canUseIsFirstVideoLogic()) {
      if (this.adapterListener.isFirstVideoRequest() || isAuthVideo) {
        this.doSignInProgressCheckAndDeeplink(isAuthVideo);
      } else if (!isAuthVideo) {
        this.deeplink();
      }
    } else {
      this.doSignInProgressCheckAndDeeplink(isAuthVideo);
    }
  }

  private doSignInProgressCheckAndDeeplink(isAuthVideo: boolean) {
    setTimeout(() => {
      if (this.appLifecycleAdapter.getIsSignInInProgress() || isAuthVideo) {
        this.waitForSignInUpdateAndDeeplink();
      } else {
        this.deeplink();
      }
    }, 1000);
  }

  private waitForSignInUpdateAndDeeplink() {
    const appReadyModel = this.appLifecycleAdapter.getAppReadyModel();
    if (appReadyModel && this.waitingForSignInCallback) {
      this.waitingForSignInCallback(appReadyModel);
    }
  }

  private deeplink() {
    const appReadyModel = this.appLifecycleAdapter.getAppReadyModel();
    if (appReadyModel && this.deeplinkCallback) {
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
    setTimeout(() => {
      if (this.isAppReady && this.onVideoStartCallback) {
        this.onVideoStartCallback(videoInfo);
      }
      this.deeplinkStart(videoInfo);
      this.setVideoInfo(videoInfo);
    }, 1000);
  }

  setVideoInfo(videoInfo: VideoInfo | null) {
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
      clearInterval(this.signInCheckInterval);
      this.signInCheckInterval = undefined;
    }
  }

  deeplinkStop() {
    if (this.signInCheckInterval) {
      clearInterval(this.signInCheckInterval);
      this.signInCheckInterval = undefined;

      this.checkIfNeedToDeeplink();
      this.setVideoInfo(null);
    }
  }

  checkIfNeedToDeeplink() {
    if (!this._isVideoInfo) {
      return;
    }
    const videoRequiresAuthentication =
      videos.find(video => video.guid == this._isVideoInfo?.guid)
        ?.requiresAuthentication ?? false;

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
