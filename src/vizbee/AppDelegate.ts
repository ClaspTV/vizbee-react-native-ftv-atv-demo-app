//@ts-ignore
import {VizbeeAppDelegate} from 'react-native-vizbee-receiver-sdk';

export class AppDelegate extends VizbeeAppDelegate {
  isAppReady: boolean;
  deferredStartVideo: any;
  currentlyPlayingVideo: any;
  onVideoStartCallback: ((videoInfo: any) => void) | null;

  constructor() {
    super();
    this.isAppReady = false;
    this.currentlyPlayingVideo = null;
    this.onVideoStartCallback = null;
  }

  onSignIn(signInInfo: any) {
    // Implement sign-in logic here if needed
  }

  onSendersActive() {
    // Notify observers if needed
  }

  onSendersInactive() {
    // Notify observers if needed
  }

  onStartVideo(videoInfo: any) {
    // sanity
    if (!videoInfo) {
      return;
    }

    // Check if the app is ready and not in the middle of signing in.
    // If not ready or signing in, defer the video start.
    if (!this.isAppReady) {
      this.deferredStartVideo = videoInfo;
      return;
    }

    if (!this.currentlyPlayingVideo && this.isAppReady) {
      this.setCurrentlyPlayingVideo(videoInfo);
      if (this.onVideoStartCallback) {
        this.onVideoStartCallback(videoInfo);
      }
    }
  }

  setOnVideoStartCallback(callback: (videoInfo: any) => void) {
    this.onVideoStartCallback = callback;
  }

  setCurrentlyPlayingVideo(videoInfo: any) {
    this.currentlyPlayingVideo = videoInfo;
  }

  setIsAppReady(isAppReady: boolean) {
    this.isAppReady = isAppReady;
    if (this.deferredStartVideo && this.isAppReady) {
      this.onStartVideo(this.deferredStartVideo);
      this.deferredStartVideo = null;
    }
  }
}

export default AppDelegate;
