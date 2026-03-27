import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import { useNavigation } from 'expo-router';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

type TabKey = 'challenge' | 'index' | 'profile';

const TAB_ORDER: TabKey[] = ['index', 'challenge', 'profile'];
const NAVIGATION_COOLDOWN_MS = 260;
const SWIPE_DISTANCE_PX = 72;

type SwipeableTabScreenProps = {
  currentTab: TabKey;
  children: ReactNode;
};

export function SwipeableTabScreen({ currentTab, children }: SwipeableTabScreenProps) {
  const navigation = useNavigation();
  const lastNavigationAtRef = useRef(0);

  const navigateToTab = useCallback(
    (direction: 'left' | 'right') => {
      const now = Date.now();
      if (now - lastNavigationAtRef.current < NAVIGATION_COOLDOWN_MS) return;

      const currentIndex = TAB_ORDER.indexOf(currentTab);
      if (currentIndex === -1) return;

      const nextIndex = direction === 'left' ? currentIndex + 1 : currentIndex - 1;
      if (nextIndex < 0 || nextIndex >= TAB_ORDER.length) return;

      const nextTab = TAB_ORDER[nextIndex];
      const tabNavigation = navigation as any;

      lastNavigationAtRef.current = now;

      if (typeof tabNavigation.jumpTo === 'function') {
        tabNavigation.jumpTo(nextTab);
        return;
      }

      navigation.navigate(nextTab as never);
    },
    [currentTab, navigation]
  );

  const gesture = useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-18, 18])
        .failOffsetY([-16, 16])
        .onEnd((event) => {
          const isHorizontalSwipe =
            Math.abs(event.translationX) >= SWIPE_DISTANCE_PX &&
            Math.abs(event.translationX) > Math.abs(event.translationY) * 1.35;

          if (!isHorizontalSwipe) return;

          const direction = event.translationX < 0 ? 'left' : 'right';
          runOnJS(navigateToTab)(direction);
        }),
    [navigateToTab]
  );

  return (
    <GestureDetector gesture={gesture}>
      <View style={styles.container}>{children}</View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
