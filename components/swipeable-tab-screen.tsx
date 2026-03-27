import { type ReactNode, useCallback, useMemo } from 'react';
import { useNavigation } from 'expo-router';
import { TabActions, useFocusEffect } from '@react-navigation/native';
import { StyleSheet, useWindowDimensions } from 'react-native';
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
  const { width } = useWindowDimensions();
  const translateX = useSharedValue(0);
  const isNavigating = useSharedValue(false);

  useFocusEffect(
    useCallback(() => {
      translateX.value = 0;
      isNavigating.value = false;
    }, [isNavigating, translateX])
  );

  const navigateToTab = useCallback(
    (direction: 'left' | 'right') => {
      const currentIndex = TAB_ORDER.indexOf(currentTab);
      if (currentIndex === -1) return;

      const nextIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;

      const nextTab = TAB_ORDER[nextIndex];
      const navigator = navigation.getParent() ?? navigation;
      navigator.dispatch(TabActions.jumpTo(nextTab));
    },
    [currentTab, navigation]
  );

  const pan = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-12, 12])
        .onUpdate((event) => {
          if (isNavigating.value) return;
          translateX.value = event.translationX * 0.35;
        })
        .onEnd((event) => {
          if (isNavigating.value) return;

          const hasSwipeIntent = Math.abs(event.translationX) > SWIPE_THRESHOLD;

          if (hasSwipeIntent) {
            const direction = event.translationX < 0 ? 'left' : 'right';
            const exitDistance = direction === 'left' ? -Math.min(width * 0.2, 64) : Math.min(width * 0.2, 64);

            isNavigating.value = true;
            translateX.value = withTiming(
              exitDistance,
              {
                duration: 150,
                easing: Easing.out(Easing.cubic),
              },
              (finished) => {
                if (!finished) {
                  isNavigating.value = false;
                  return;
                }

                translateX.value = 0;
                isNavigating.value = false;
                runOnJS(navigateToTab)(direction);
              }
            );
            return;
          }

          translateX.value = withTiming(0, {
            duration: 180,
            easing: Easing.out(Easing.cubic),
          });
        }),
    [isNavigating, navigateToTab, translateX, width]
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
