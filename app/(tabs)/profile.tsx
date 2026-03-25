import { StyleSheet, Text, View } from 'react-native';

const USER = {
  username: '@mc_verso',
  rapStyle: 'Doble punch',
};

export default function ProfileScreen() {
  return (
    <View style={styles.container}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingTop: 32,
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 10,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#191919',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2A2A2A',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
  },
  username: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  rapStyle: {
    color: '#D1D1D1',
    fontSize: 15,
    fontWeight: '600',
  },
  section: {
    gap: 12,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontWeight: '700',
  },
  emptyState: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#111111',
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  emptyStateText: {
    color: '#BEBEBE',
    fontSize: 15,
  },
  rapSectionCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#2A2A2A',
    backgroundColor: '#111111',
    padding: 16,
  },
  rapSectionText: {
    color: '#BEBEBE',
    fontSize: 15,
    lineHeight: 22,
  },
});
