import {VideoInfo} from '../types';
// @ts-ignore
import {VizbeeManager} from 'react-native-vizbee-receiver-sdk';
import {PlayerDelegate} from '../../PlayerDelegate';
import NavigationManager from '../../utils/NavigationManager';
import VideoEvents from '../../utils/VideoEvents';

export class DeeplinkManager {
  private videoInfo: VideoInfo | null = null;
  private unsubscribe: any;
  constructor() {}

  deeplinkVideo(videoInfo: VideoInfo, positionMs: number) {
    this.videoInfo = videoInfo;

    const customMetadata = videoInfo.customMetadata || {};
    const streamType = customMetadata.streamType || 'vod';

    try {
      // Navigate to the VideoPlayer screen with the provided video info has to be done by client
      NavigationManager.getInstance().navigate('VideoPlayer', {
        guid: videoInfo.guid,
        title: videoInfo.title,
        isLive: videoInfo.isLive,
        videoUrl: videoInfo.videoURL,
        imageUrl: videoInfo.imageURL,
        streamType: streamType,
        position: positionMs,
      });
    } catch (error) {
      this.handleDeeplinkFailure();
    }
  }

  handleDeeplinkFailure() {
    if (!this.videoInfo) return;
    const videoInfo = this.videoInfo;
    const playerDelegate = new PlayerDelegate(null, videoInfo, () => {});
    VizbeeManager.setPlayerDelegate(playerDelegate);
    playerDelegate.updatePlaybackState({interrupted: true});
    this.unsubscribe = VideoEvents.onInterruptedStatusSent(() => {
      this.unsubscribe();
      setTimeout(() => {
        VizbeeManager.removePlayerDelegate();
      }, 500);
      this.videoInfo = null;
    });
  }

  sendFakeDeeplinkFailure(videoInfo: VideoInfo) {
    this.videoInfo = videoInfo;
    this.handleDeeplinkFailure();
  }
}
