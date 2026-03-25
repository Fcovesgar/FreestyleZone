import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function DailyChallengeOverlayScreen() {
  return (
    <SafeAreaView style={styles.backdrop} edges={['top', 'bottom']}>
      <View style={styles.overlayCard}>
        <Text style={styles.title}>Reto diario</Text>
        <Text style={styles.description}>Overlay pendiente de diseño.</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: '#060606',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  overlayCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#202020',
    backgroundColor: '#0E0E0E',
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 6,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
  },
  description: {
    color: '#9C9C9C',
    fontSize: 14,
  },
});
