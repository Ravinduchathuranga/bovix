import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  FlatList,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getDashboardDataUseCase, addCattleUseCase } from '../../di/container';
import { Cattle, DashboardMetrics } from '../../domain/entities/cattle';
import { SafeAreaView } from 'react-native-safe-area-context';

export const DashboardScreen: React.FC = () => {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentCattle, setRecentCattle] = useState<Cattle[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Cattle Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newName, setNewName] = useState('');
  const [newBreed, setNewBreed] = useState('Holstein Friesian');
  const [newYield, setNewYield] = useState('20.0');
  const [addingCattle, setAddingCattle] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getDashboardDataUseCase.execute();
      setMetrics(data.metrics);
      setRecentCattle(data.recentCattle);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddCattle = async () => {
    if (!newTag.trim() || !newName.trim()) {
      Alert.alert('Validation Error', 'Please fill in Tag Number and Name.');
      return;
    }
    setAddingCattle(true);
    try {
      await addCattleUseCase.execute({
        tagNumber: newTag,
        name: newName,
        breed: newBreed,
        ageYears: 3,
        gender: 'female',
        status: 'lactating',
        dailyMilkYieldLiters: parseFloat(newYield) || 0,
        lastMilkingTime: 'Just now',
        healthStatus: 'healthy',
      });
      setModalVisible(false);
      setNewTag('');
      setNewName('');
      loadData(); // Refresh list & metrics
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add cattle');
    } finally {
      setAddingCattle(false);
    }
  };

  const getStatusBadge = (status: Cattle['status']) => {
    switch (status) {
      case 'lactating':
        return { label: 'Lactating', bg: '#064E3B', color: '#34D399' };
      case 'dry':
        return { label: 'Dry', bg: '#365314', color: '#A3E635' };
      case 'pregnant':
        return { label: 'Pregnant', bg: '#1E1B4B', color: '#818CF8' };
      case 'sick':
        return { label: 'Sick', bg: '#451A1A', color: '#FCA5A5' };
      default:
        return { label: status, bg: '#334155', color: '#94A3B8' };
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.name || 'Farmer'}</Text>
          <Text style={styles.farmName}>{user?.farmName || 'Bovix Farm'}</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Fetching Dairy Metrics...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Key Metrics Overview */}
          <Text style={styles.sectionTitle}>Farm Overview</Text>
          <View style={styles.metricsGrid}>
            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🐄</Text>
              <Text style={styles.metricValue}>{metrics?.totalCattleCount || 0}</Text>
              <Text style={styles.metricLabel}>Total Cattle</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🥛</Text>
              <Text style={styles.metricValue}>{metrics?.todayMilkYieldTotal || 0} L</Text>
              <Text style={styles.metricLabel}>Today's Milk</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>⚡</Text>
              <Text style={styles.metricValue}>{metrics?.lactatingCount || 0}</Text>
              <Text style={styles.metricLabel}>Lactating Cows</Text>
            </View>

            <View style={styles.metricCard}>
              <Text style={styles.metricIcon}>🩺</Text>
              <Text style={[styles.metricValue, { color: '#F87171' }]}>
                {metrics?.needsAttentionCount || 0}
              </Text>
              <Text style={styles.metricLabel}>Attention Needed</Text>
            </View>
          </View>

          {/* Action Bar */}
          <View style={styles.actionHeader}>
            <Text style={styles.sectionTitle}>Recent Cattle</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add Cow</Text>
            </TouchableOpacity>
          </View>

          {/* Cattle List */}
          {recentCattle.map((cow) => {
            const badge = getStatusBadge(cow.status);
            return (
              <View key={cow.id} style={styles.cattleCard}>
                <View style={styles.cattleCardHeader}>
                  <View>
                    <Text style={styles.cattleName}>{cow.name}</Text>
                    <Text style={styles.cattleTag}>Tag: {cow.tagNumber} • {cow.breed}</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                    <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                  </View>
                </View>

                <View style={styles.cattleCardFooter}>
                  <Text style={styles.yieldText}>
                    Yield: <Text style={styles.yieldVal}>{cow.dailyMilkYieldLiters} L/day</Text>
                  </Text>
                  <Text style={styles.healthText}>
                    Status: {cow.healthStatus === 'healthy' ? '💚 Healthy' : '⚠️ Attention'}
                  </Text>
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* Modal to Register New Cattle */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Register New Cattle</Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Tag Number (e.g. BVX-106)"
              placeholderTextColor="#999"
              value={newTag}
              onChangeText={setNewTag}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Cow Name (e.g. Bella)"
              placeholderTextColor="#999"
              value={newName}
              onChangeText={setNewName}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Breed (e.g. Jersey)"
              placeholderTextColor="#999"
              value={newBreed}
              onChangeText={setNewBreed}
            />

            <TextInput
              style={styles.modalInput}
              placeholder="Est. Daily Milk Yield (Liters)"
              placeholderTextColor="#999"
              keyboardType="numeric"
              value={newYield}
              onChangeText={setNewYield}
            />

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleAddCattle}
                disabled={addingCattle}
              >
                {addingCattle ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Cattle</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  farmName: {
    fontSize: 13,
    color: '#10B981',
    marginTop: 2,
  },
  logoutBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metricLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 4,
  },
  actionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
  },
  cattleCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cattleCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cattleName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  cattleTag: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cattleCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  yieldText: {
    color: '#94A3B8',
    fontSize: 13,
  },
  yieldVal: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  healthText: {
    color: '#CBD5E1',
    fontSize: 12,
  },

  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 16,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 8,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#94A3B8',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
