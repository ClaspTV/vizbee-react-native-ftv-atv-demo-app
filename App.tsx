import React, {useState, useEffect, useRef} from 'react';
import {View, StyleSheet} from 'react-native';
//@ts-ignore
import {VizbeeManager} from 'react-native-vizbee-receiver-sdk';
import AppDelegate from './src/vizbee/AppDelegate';
import MainScreen, {Video} from './src/MainScreen';
import VideoPlayer from './src/VideoPlayer';

export const VIZBEE_APPID = 'vzb2000001';

const App = () => {
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const appDelegateRef = useRef<AppDelegate | null>(null);

  useEffect(() => {
    appDelegateRef.current = new AppDelegate();
    VizbeeManager.init(VIZBEE_APPID, appDelegateRef.current);
    appDelegateRef.current.setOnVideoStartCallback(handleVideoStart);
    appDelegateRef.current.setIsAppReady(true);

    return () => {
      VizbeeManager.getAppDelegate().setOnVideoStartCallback(null);
    };
  }, []);

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    if (appDelegateRef.current) {
      appDelegateRef.current.setCurrentlyPlayingVideo(video);
    }
  };

  const handleVideoStart = (videoInfo: any) => {
    setSelectedVideo(videoInfo);
    if (appDelegateRef.current) {
      appDelegateRef.current.setCurrentlyPlayingVideo(videoInfo);
    }
  };

  const handleCloseVideo = () => {
    if (appDelegateRef.current) {
      appDelegateRef.current.setCurrentlyPlayingVideo(null);
    }
    setSelectedVideo(null);
  };

  return (
    <View style={styles.container}>
      {selectedVideo ? (
        <VideoPlayer video={selectedVideo} onClose={handleCloseVideo} />
      ) : (
        <MainScreen onVideoSelect={handleVideoSelect} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#000',
  },
});

export default App;
