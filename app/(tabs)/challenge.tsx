import { StyleSheet, Text, View } from 'react-native';

export default function DailyChallengeOverlayScreen() {
  return (
    <View style={styles.backdrop}>
      <View style={styles.overlayCard}>
        <Text style={styles.title}>Reto diario</Text>
        <Text style={styles.description}>Overlay pendiente de diseño.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.82)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  overlayCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#101010',
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  description: {
    color: '#BBBBBB',
    fontSize: 15,
  },
});
