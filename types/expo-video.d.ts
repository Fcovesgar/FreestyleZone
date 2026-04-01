declare module 'expo-video' {
  import type { ComponentType } from 'react';
  import type { StyleProp, ViewStyle } from 'react-native';

  export type VideoSource = { uri: string } | number | null;

  export type VideoPlayer = {
    pause: () => void;
    loop: boolean;
  };

  export function useVideoPlayer(source: VideoSource, setup?: (player: VideoPlayer) => void): VideoPlayer;

  export const VideoView: ComponentType<{
    player: VideoPlayer;
    style?: StyleProp<ViewStyle>;
    contentFit?: 'contain' | 'cover' | 'fill';
    nativeControls?: boolean;
  }>;
}
