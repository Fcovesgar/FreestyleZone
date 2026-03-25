import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const USER = {
  username: '@mc_verso',
  rapStyle: 'Doble punch',
};

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>MV</Text>
        </View>
        <Text style={styles.username}>{USER.username}</Text>
        <Text style={styles.rapStyle}>Estilo: {USER.rapStyle}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mis grabaciones</Text>
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>Aún no hay videos subidos.</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Rapear</Text>
        <View style={styles.rapSectionCard}>
          <Text style={styles.rapSectionText}>Usa la pestaña del micrófono para crear una nueva sesión.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 22,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#141414',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#202020',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '700',
  },
  rapStyle: {
    color: '#AEAEAE',
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
  emptyState: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#0E0E0E',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    color: '#9A9A9A',
    fontSize: 14,
  },
  rapSectionCard: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#0E0E0E',
    padding: 16,
  },
  rapSectionText: {
    color: '#9A9A9A',
    fontSize: 14,
    lineHeight: 20,
  },
});
