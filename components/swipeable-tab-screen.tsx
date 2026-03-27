import { type ReactNode, useCallback, useMemo } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { useNavigation } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

type TabKey = 'challenge' | 'index' | 'profile';

const TAB_ORDER: TabKey[] = ['index', 'challenge', 'profile'];
const SWIPE_THRESHOLD = 70;

type SwipeableTabScreenProps = {
  currentTab: TabKey;
  children: ReactNode;
};

export function SwipeableTabScreen({ currentTab, children }: SwipeableTabScreenProps) {
  const navigation = useNavigation();
  const translateX = useSharedValue(0);
  const canSwipe = Platform.OS === 'ios' || Platform.OS === 'android';

  const navigateToTab = useCallback(
    (direction: 'left' | 'right') => {
      const currentIndex = TAB_ORDER.indexOf(currentTab);
      if (currentIndex === -1) return;

      const nextIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;

      const nextTab = TAB_ORDER[nextIndex];
      navigation.navigate(nextTab as never);
    },
    [currentTab, navigation]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .enabled(canSwipe)
        .activeOffsetX([-14, 14])
        .failOffsetY([-12, 12])
        .onUpdate((event) => {
          translateX.value = event.translationX * 0.35;
        })
        .onEnd((event) => {
          const hasSwipeIntent = Math.abs(event.translationX) > SWIPE_THRESHOLD;

          if (hasSwipeIntent) {
            const direction = event.translationX < 0 ? 'left' : 'right';
            translateX.value = withTiming(event.translationX < 0 ? -42 : 42, {
              duration: 160,
              easing: Easing.out(Easing.quad),
            });
            translateX.value = withTiming(0, {
              duration: 200,
              easing: Easing.out(Easing.cubic),
            });
            runOnJS(navigateToTab)(direction);
            return;
          }

          translateX.value = withTiming(0, {
            duration: 220,
            easing: Easing.out(Easing.cubic),
          });
        }),
    [canSwipe, navigateToTab, translateX]
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.container, animatedStyle]}>{children}</Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
