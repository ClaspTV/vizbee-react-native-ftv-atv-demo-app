import React from 'react';
import {StyleSheet, View, Text, Image, TouchableOpacity} from 'react-native';

const videos = [
  {
    guid: 'elephants',
    title: 'Elephants Dream',
    imageURL:
      'https://s3.amazonaws.com/vizbee/images/demoapp/elephants_dream.jpg',
    videoURL:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/hls/ElephantsDream.m3u8',
    isLive: false,
  },
  {
    guid: 'tears',
    title: 'Tears of Steel',
    imageURL:
      'https://s3.amazonaws.com/vizbee/images/demoapp/20732e42e9cec9dcf99dc305cb6615e3.jpg',
    videoURL:
      'https://commondatastorage.googleapis.com/gtv-videos-bucket/CastVideos/hls/TearsOfSteel.m3u8',
    isLive: false,
  },
];

export type Video = {
  guid: string;
  title: string;
  imageURL: string;
  videoURL: string;
  isLive: boolean;
  startPosition: number;
};

const MainScreen = ({onVideoSelect}: {onVideoSelect: Function}) => {
  return (
    <View style={styles.mainContainer}>
      <Text style={styles.appTitle}>Vizbee Demo App</Text>
      <View style={styles.videoGrid}>
        {videos.map(video => (
          <TouchableOpacity
            key={video.guid}
            onPress={() => onVideoSelect(video)}
            style={styles.videoItem}>
            <Image source={{uri: video.imageURL}} style={styles.thumbnail} />
            <Text style={styles.videoTitle}>{video.title}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  appTitle: {
    fontSize: 32,
    color: '#fff',
    marginBottom: 32,
  },
  videoGrid: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  videoItem: {
    alignItems: 'center',
    marginHorizontal: 20,
  },
  thumbnail: {
    width: 220,
    height: 300,
    resizeMode: 'contain',
  },
  videoTitle: {
    color: '#fff',
    fontSize: 28,
    marginTop: 8,
    textAlign: 'center',
  },
});

export default MainScreen;
