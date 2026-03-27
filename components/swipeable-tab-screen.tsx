import { type ReactNode, useCallback, useMemo, useRef } from 'react';
import { useNavigation } from 'expo-router';
import { TabActions } from '@react-navigation/native';
import { Directions, Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { StyleSheet, View } from 'react-native';

type TabKey = 'challenge' | 'index' | 'profile';

const TAB_ORDER: TabKey[] = ['index', 'challenge', 'profile'];
const NAVIGATION_COOLDOWN_MS = 260;

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
      let navigator: any = navigation;

      while (navigator) {
        const state = navigator.getState?.();
        const routeNames = state?.routeNames as string[] | undefined;

        if (routeNames?.includes('index') && routeNames.includes('challenge') && routeNames.includes('profile')) {
          lastNavigationAtRef.current = now;
          navigator.dispatch(TabActions.jumpTo(nextTab));
          return;
        }

        navigator = navigator.getParent?.();
      }

      lastNavigationAtRef.current = now;
      navigation.navigate(nextTab as never);
    },
    [currentTab, navigation]
  );

  const gesture = useMemo(() => {
    const leftFling = Gesture.Fling()
      .direction(Directions.LEFT)
      .onEnd(() => {
        runOnJS(navigateToTab)('left');
      });

    const rightFling = Gesture.Fling()
      .direction(Directions.RIGHT)
      .onEnd(() => {
        runOnJS(navigateToTab)('right');
      });

    return Gesture.Race(leftFling, rightFling);
  }, [navigateToTab]);

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
