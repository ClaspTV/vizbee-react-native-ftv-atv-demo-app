import {
    VizbeePlayerDelegate,
    VizbeeVideoInfo,
    VizbeeVideoStatus,
    VizbeeManager,
} from "react-native-vizbee-receiver-sdk";
import {videoPlayer} from "../../video/videoPlayer";

export class NFLPlayerDelegate extends VizbeePlayerDelegate {
    videoPlayer: any | null | undefined;

    constructor(videoPlayer) {
        super();
        this.videoPlayer = videoPlayer;
    }

    /**
     * The following methods are invoked by the Vizbee SDK when a corresponding action is triggered by the user from the mobile app.
     * 
     * - onPlay(): Invoked when the user initiates playback from the mobile app.
     * - onPause(): Invoked when the user pauses playback from the mobile app.
     * - onSeek(seekPos: number): Invoked when the user seeks to a specific position in the video from the mobile app.
     * - onStop(_stopReason: string): Invoked when the user stops playback from the mobile app.
     */
    onPlay() {
        this.videoPlayer?.resume();
    }

    onPause() {
        this.videoPlayer?.pause();
    }

    onSeek(seekPos: number) {
        this.videoPlayer?.seek(seekPos / 1000);
    }

    onStop(_stopReason: string) {
        this.videoPlayer = null;
        VizbeeManager.removePlayerDelegate();
    }

    /**
     * This method is called by the Vizbee React Native SDK to get the currently playing video info when the video starts playing.
     * It returns the video information including the video ID, title, duration, live status, and image URL.
     * 
     * @returns {VizbeeVideoInfo} The video information object.
     */
    getVideoInfo() {
        const {
            videoId,
            title,
            duration,
            isLive,
            imageURL,
        } = this.videoPlayer?.currentVideo || {};

        const vizbeeVideoInfo: VizbeeVideoInfo = new VizbeeVideoInfo();
        vizbeeVideoInfo.guid = videoId;
        vizbeeVideoInfo.title = title;
        vizbeeVideoInfo.duration = duration;
        vizbeeVideoInfo.isLive = isLive;
        vizbeeVideoInfo.imageURL = imageURL;
        return vizbeeVideoInfo;
    }

    /**
     * This method is called by the Vizbee React Native SDK to get the current status of the video.
     * It returns the video status including the ad status, playback status, current position, and duration.
     * 
     * @returns {VizbeeVideoStatus} The video status object.
     */
    getVideoStatus() {
        const vizbeeVideoStatus: VizbeeVideoStatus = new VizbeeVideoStatus();

        // ad status
        vizbeeVideoStatus.isPlayingAd = this.videoPlayer?.adShowing;

        // playback status
        if (this.videoPlayer?.loading) {
            vizbeeVideoStatus.playbackState = "loading";
        } else if (this.videoPlayer?.started && this.videoPlayer?.playing) {
            vizbeeVideoStatus.playbackState = "playing";
        } else if (this.videoPlayer?.started && !this.videoPlayer?.playing) {
            vizbeeVideoStatus.playbackState = "paused";
        } else if (this.videoPlayer?.error) {
            vizbeeVideoStatus.playbackState = "failed";
        } else if (this.videoPlayer?.ended) {
            vizbeeVideoStatus.playbackState = "finished";
        } else {
            vizbeeVideoStatus.playbackState = "unknown";
        }

        // duration & position
        vizbeeVideoStatus.currentPosition = this.videoPlayer?.currentTime * 1000;
        vizbeeVideoStatus.duration = this.convertSecondsToMilliseconds(
            vizbeeVideoStatus.isPlayingAd ? this.videoPlayer?.adDuration : this.videoPlayer?.videoDuration
        );
        return vizbeeVideoStatus;
    }

    convertSecondsToMilliseconds(paramInSeconds: any) {
        const valueInSeconds = Number(paramInSeconds);
        const valueInMilliseconds = Number.isFinite(valueInSeconds)
            ? valueInSeconds * 1000
            : 0;
        return valueInMilliseconds;
    }
}