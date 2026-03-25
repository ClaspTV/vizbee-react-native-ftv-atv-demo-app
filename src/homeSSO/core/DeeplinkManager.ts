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
      console.log(
        'Deeplink invoked:',
        JSON.stringify({videoInfo, positionMs}, null, 2),
      );

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
      console.error('Deeplink failed:', error);
      this.handleDeeplinkFailure();
    }
  }

  handleDeeplinkFailure() {
    console.log('Handling deeplink failure');
    if (!this.videoInfo) return;
    console.log('Sending fake deeplink failure status');
    const videoInfo = this.videoInfo;
    const playerDelegate = new PlayerDelegate(null, videoInfo, null);
    VizbeeManager.setPlayerDelegate(playerDelegate);
    playerDelegate.updatePlaybackState({interrupted: true});
    this.unsubscribe = VideoEvents.onInterruptedStatusSent(() => {
      console.log('Fake deeplink failure status received');
      this.unsubscribe();
      setTimeout(() => {
        console.log('Removing player delegate after fake failure');
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
