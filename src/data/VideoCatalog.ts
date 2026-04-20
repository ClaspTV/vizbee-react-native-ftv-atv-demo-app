export const videos = [
  {
    guid: 'elephants',
    title: 'Elephants Dream',
    subtitle: 'Free HLS video',
    imageURL:
      'https://s3.amazonaws.com/vizbee/images/demoapp/elephants_dream.jpg',
    videoURL:
      'https://d2zihajmogu5jn.cloudfront.net/elephantsdream/hls/ed_hd.m3u8',
    isLive: false,
    requiresAuthentication: false,
  },
  {
    guid: 'tears',
    title: 'Tears of Steel',
    subtitle: 'Free HLS video',
    imageURL:
      'https://s3.amazonaws.com/vizbee/images/demoapp/20732e42e9cec9dcf99dc305cb6615e3.jpg',
    videoURL:
      'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8',
    isLive: false,
    requiresAuthentication: false,
  },
  {
    guid: 'akamai-live-stream',
    title: 'Akamai Live Stream',
    subtitle: 'Live stream subtitle',
    imageURL:
      'https://chiefit.me/wp-content/uploads/2018/04/Akamai-Logo835x396.jpg',
    videoURL: 'https://ireplay.tv/test/blender.m3u8',
    isLive: true,
    requiresAuthentication: false,
  },
  {
    guid: 'sintel',
    title: '(Auth) Sintel',
    subtitle: 'Auth sintel subtitle',
    imageURL: 'https://s3.amazonaws.com/vizbee/images/demoapp/sintel.jpg',
    videoURL:
      'http://www.peach.themazzone.com/durian/movies/sintel-2048-surround.mp4',
    isLive: false,
    requiresAuthentication: true,
  },
];
