import {
  VizbeePlayerDelegate,
  VizbeeVideoInfo,
  VizbeeVideoStatus,
  // @ts-ignore
} from 'react-native-vizbee-receiver-sdk';
import {VideoRef} from 'react-native-video';
import VideoEvents from './utils/VideoEvents';

export class PlayerDelegate extends VizbeePlayerDelegate {
  videoPlayer: VideoRef | null;
  video: any;
  currentTime: number;
  videoDuration: number;
  playbackState: {
    loading: boolean;
    started: boolean;
    playing: boolean;
    ended: boolean;
    error: boolean;
    interrupted: boolean;
  };
  onStopCallback: () => void;

  constructor(
    videoPlayer: VideoRef | null,
    video: any,
    onStopCallback: () => void,
  ) {
    super();

    this.videoPlayer = videoPlayer;
    this.video = video;
    this.currentTime = 0;
    this.videoDuration = 0;
    this.playbackState = {
      loading: false,
      started: false,
      playing: false,
      ended: false,
      error: false,
      interrupted: false,
    };
    this.onStopCallback = onStopCallback;
  }

  onPlay() {
    if (this.videoPlayer) {
      this.videoPlayer.resume();
    }
  }

  onPause() {
    if (this.videoPlayer) {
      this.videoPlayer.pause();
    }
  }

  onSeek(seekPos: number) {
    if (this.videoPlayer) {
      this.videoPlayer.seek(seekPos / 1000);
    }
  }

  onStop(_stopReason: string) {
    if (this.videoPlayer) {
      this.videoPlayer.seek(this.videoDuration);
    }
    this.updatePlaybackState({
      started: false,
      playing: false,
      ended: true,
    });
    if (this.onStopCallback) {
      this.onStopCallback();
    }
  }

  getVideoInfo(): VizbeeVideoInfo {
    const video = this.video || {};
    const vizbeeVideoInfo = new VizbeeVideoInfo();
    vizbeeVideoInfo.guid = video.guid;
    vizbeeVideoInfo.title = video.title;
    vizbeeVideoInfo.duration = video.duration;
    vizbeeVideoInfo.isLive = video.isLive;
    vizbeeVideoInfo.imageURL = video.imageURL;

    return vizbeeVideoInfo;
  }

  getVideoStatus(): VizbeeVideoStatus {
    const vizbeeVideoStatus = new VizbeeVideoStatus();

    if (this.playbackState.loading) {
      vizbeeVideoStatus.playbackState = 'loading';
    } else if (this.playbackState.started && this.playbackState.playing) {
      vizbeeVideoStatus.playbackState = 'playing';
    } else if (this.playbackState.started && !this.playbackState.playing) {
      vizbeeVideoStatus.playbackState = 'paused';
    } else if (this.playbackState.error) {
      vizbeeVideoStatus.playbackState = 'failed';
    } else if (this.playbackState.ended) {
      vizbeeVideoStatus.playbackState = 'finished';
    } else if (this.playbackState.interrupted) {
      vizbeeVideoStatus.playbackState = 'interrupted';
      VideoEvents.emitInterruptedStatusSent();
    } else {
      vizbeeVideoStatus.playbackState = 'unknown';
    }

    if (vizbeeVideoStatus.playbackState !== 'unknown') {
      vizbeeVideoStatus.currentPosition = this.currentTime * 1000;
      vizbeeVideoStatus.duration = this.convertSecondsToMilliseconds(
        this.videoDuration,
      );
    }

    return vizbeeVideoStatus;
  }

  updatePlaybackState(newState: Partial<typeof this.playbackState>) {
    this.playbackState = {...this.playbackState, ...newState};
  }

  private convertSecondsToMilliseconds(paramInSeconds: number): number {
    return Number.isFinite(paramInSeconds) ? paramInSeconds * 1000 : 0;
  }
}
