import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {StyleSheet, View, TouchableOpacity, Text} from 'react-native';
import Video, {VideoRef} from 'react-native-video';
// @ts-ignore
import {VizbeeManager} from 'react-native-vizbee-receiver-sdk';
import {PlayerDelegate} from './PlayerDelegate';
import {useRoute, useNavigation, RouteProp} from '@react-navigation/native';
import VideoEvents from './utils/VideoEvents';

interface VideoInfo {
  videoURL?: string;
  url?: string;
  title?: string;
  imageURL?: string;
  guid?: string;
  live?: boolean;
}

const VideoPlayer = () => {
  const route = useRoute<RouteProp<any>>();
  const navigation = useNavigation();
  const videoRef = useRef<VideoRef>(null);
  const playerDelegateRef = useRef<PlayerDelegate | null>(null);

  // Determine video source from either props or navigation params
  const video: VideoInfo = useMemo(() => ({
    videoURL: route.params?.videoUrl,
    title: route.params?.title,
    imageURL: route.params?.imageUrl,
    guid: route.params?.guid,
    live: route.params?.isLive ?? false,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [route.params?.videoUrl, route.params?.guid]);

  let position = route.params?.position || 0;

  // Handle close from both prop callback and navigation
  const handleClose = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  useEffect(() => {
    if (videoRef.current && video) {
      console.log('Initializing PlayerDelegate with video:', video);
      playerDelegateRef.current = new PlayerDelegate(
        videoRef.current,
        video,
        handleClose,
      );
      VizbeeManager.setPlayerDelegate(playerDelegateRef.current);
    }

    return () => {
      console.log('Cleaning up PlayerDelegate');
      if (playerDelegateRef.current) {
        VizbeeManager.removePlayerDelegate();
        playerDelegateRef.current = null;
      }
      VideoEvents.emitVideoStopped();
    };
  }, [video, handleClose]);

  const onProgress = (data: {currentTime: number}) => {
    if (playerDelegateRef.current) {
      playerDelegateRef.current.currentTime = data.currentTime;
    }
  };

  const onLoad = (data: {duration: number}) => {
    console.log('Video loaded:', data);
    if (playerDelegateRef.current) {
      playerDelegateRef.current.videoDuration = data.duration;
      playerDelegateRef.current.updatePlaybackState({
        loading: false,
        started: true,
        ended: false,
      });
    }
    if (position > 0 && videoRef.current) {
      videoRef.current.seek(position / 1000 - 2);
      position = 0; // Reset position to avoid seeking again
    }
    VideoEvents.emitVideoStarted();
  };

  const onBuffer = ({isBuffering}: {isBuffering: boolean}) => {
    console.log('Buffer state:', isBuffering);
    if (playerDelegateRef.current) {
      playerDelegateRef.current.updatePlaybackState({
        loading: isBuffering,
      });
    }
  };

  const onEnd = () => {
    console.log('Video ended');
    if (playerDelegateRef.current) {
      playerDelegateRef.current.updatePlaybackState({
        started: false,
        ended: true,
        playing: false,
      });
    }
    VideoEvents.emitVideoStopped();
  };

  const onPlaybackStateChanged = (data: {isPlaying: boolean}) => {
    console.log('Playback state changed:', data);
    if (playerDelegateRef.current) {
      playerDelegateRef.current.updatePlaybackState({
        playing: data.isPlaying,
      });
    }
  };

  const onError = (error: any) => {
    console.error('Video playback error:', error);
    VideoEvents.emitVideoStopped();
    // Handle error appropriately
  };

  if (!video.guid) {
    console.log('No video data available');
    handleClose();
    return null;
  }

  return (
    <View style={styles.playerContainer}>
      <Video
        ref={videoRef}
        source={{
          uri: video.videoURL || video.url,
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
        onError={onError}
        onProgress={onProgress}
        onPlaybackStateChanged={onPlaybackStateChanged}
      />
      <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
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
