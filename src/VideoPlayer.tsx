import React, {useEffect, useRef} from 'react';
import {StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
// @ts-ignore
import {VizbeeManager} from 'react-native-vizbee-receiver-sdk';
import {PlayerDelegate} from './vizbee/PlayerDelegate';
import {Video as VideoData} from './MainScreen';

const VideoPlayer = ({
  video,
  onClose,
}: {
  video: VideoData;
  onClose: () => void;
}) => {
  const videoRef = useRef<VideoRef>(null);
  const playerDelegateRef = useRef<PlayerDelegate | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      playerDelegateRef.current = new PlayerDelegate(
        videoRef.current,
        video,
        onClose,
      );
      VizbeeManager.setPlayerDelegate(playerDelegateRef.current);
    }

    return () => {
      if (playerDelegateRef.current) {
        VizbeeManager.removePlayerDelegate();
        playerDelegateRef.current = null;
      }
    };
  }, [video, onClose]);

  const onProgress = (data: {currentTime: number}) => {
    if (playerDelegateRef.current) {
      playerDelegateRef.current.currentTime = data.currentTime;
    }
  };

  const onLoad = (data: {duration: number}) => {
    if (playerDelegateRef.current) {
      playerDelegateRef.current.videoDuration = data.duration;
      playerDelegateRef.current.updatePlaybackState({
        loading: false,
        started: true,
        ended: false,
      });
      if (video.startPosition > 0 && data.duration) {
        playerDelegateRef.current.onSeek(video.startPosition);
        video.startPosition = 0;
      }
    }
  };

  const onBuffer = ({isBuffering}: {isBuffering: boolean}) => {
    if (playerDelegateRef.current) {
      playerDelegateRef.current.updatePlaybackState({
        loading: isBuffering,
      });
    }
  };

  const onEnd = () => {
    if (playerDelegateRef.current) {
      playerDelegateRef.current.updatePlaybackState({
        started: false,
        ended: true,
        playing: false,
      });
    }
  };

  const onPlaybackStateChanged = (data: {isPlaying: boolean}) => {
    if (playerDelegateRef.current) {
      playerDelegateRef.current.updatePlaybackState({
        playing: data.isPlaying,
      });
    }
  };

  return (
    <View style={styles.playerContainer}>
      <Video
        ref={videoRef}
        source={{
          uri: video.videoURL,
          metadata: {
            title: video.title || '',
            imageUri: video.imageURL || '',
          },
        }}
        style={styles.videoPlayer}
        controls={true}
        resizeMode="contain"
        onLoad={onLoad}
        onBuffer={onBuffer}
        onEnd={onEnd}
        onProgress={onProgress}
        onPlaybackStateChanged={onPlaybackStateChanged}
      />
      <TouchableOpacity onPress={onClose} style={styles.closeButton}>
        <Text style={styles.closeButtonText}>Close</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  playerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  videoPlayer: {
    flex: 1,
  },
  closeButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 5,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default VideoPlayer;
