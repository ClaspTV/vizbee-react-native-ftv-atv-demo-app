// types.ts
export type RootStackParamList = {
  Main: {};
  SignIn: {
    isClickNavigation: boolean;
  };
  VideoPlayer: {
    guid: string;
    title: string;
    isLive: boolean;
    videoUrl: string;
    imageUrl: string;
    streamType: string;
    position: number;
    requiresAuthentication?: boolean;
    onVideoStop?: () => void;
  };
};

export type User = {
  email: string;
};
