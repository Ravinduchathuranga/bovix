import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  recordBulkMilkUseCase,
  getMilkRecordsUseCase,
  deleteMilkRecordUseCase,
} from '../../di/container';
import { BulkMilkRecord } from '../../domain/entities/cattle';
import { AppDatePicker, formatDateFriendly } from '../components/AppDatePicker';

export const DailyMilkingScreen: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [records, setRecords] = useState<BulkMilkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Date filter state
  const [selectedFilterDate, setSelectedFilterDate] = useState<string>('');

  // Form / Modal State
  const [modalVisible, setModalVisible] = useState(false);
  const [recordDate, setRecordDate] = useState(todayStr);
  const [session, setSession] = useState<'Morning' | 'Evening'>('Morning');
  const [amountKg, setAmountKg] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const data = await getMilkRecordsUseCase.execute();
      setRecords(data);
    } catch (err) {
      console.error('Failed to load bulk milk records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  const handleSaveBulkMilk = async () => {
    if (!amountKg || isNaN(parseFloat(amountKg))) {
      Alert.alert('Validation Error', 'Please enter a valid milk amount in KG.');
      return;
    }

    setSaving(true);
    try {
      const kg = parseFloat(amountKg);
      await recordBulkMilkUseCase.execute(recordDate, session, kg, notes);

      setModalVisible(false);
      setAmountKg('');
      setNotes('');
      fetchRecords();
      Alert.alert('Success', `Recorded ${kg} KG of bulk milk for ${session} session.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record milk.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRecord = (id: string, kg: number, date: string) => {
    Alert.alert(
      'Confirm Delete',
      `Delete bulk milk record of ${kg} KG from ${date}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteMilkRecordUseCase.execute(id);
            fetchRecords();
          },
        },
      ]
    );
  };

  // Filtered records logic
  const displayedRecords = selectedFilterDate
    ? records.filter((r) => r.date === selectedFilterDate)
    : records;

  // Metrics calculations
  const todayRecords = records.filter((r) => r.date === todayStr);
  const todayTotalKg = todayRecords.reduce((acc, r) => acc + r.amountKg, 0);
  const allTimeTotalKg = records.reduce((acc, r) => acc + r.amountKg, 0);
  const filteredTotalKg = displayedRecords.reduce((acc, r) => acc + r.amountKg, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Bulk Milk Log</Text>
          <Text style={styles.headerSubtitle}>Total Dairy Production Records</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setRecordDate(todayStr);
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Log Milk (KG)</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Fetching Bulk Collection Logs...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Overview Cards */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>🥛</Text>
              <Text style={styles.summaryVal}>{todayTotalKg.toFixed(1)} KG</Text>
              <Text style={styles.summaryLbl}>Today's Total</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>📈</Text>
              <Text style={styles.summaryVal}>
                {selectedFilterDate ? `${filteredTotalKg.toFixed(1)} KG` : `${allTimeTotalKg.toFixed(1)} KG`}
              </Text>
              <Text style={styles.summaryLbl}>
                {selectedFilterDate ? 'Filtered Yield' : 'All-Time Logged'}
              </Text>
            </View>
          </View>

          {/* Collection Log List & Date Filter */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Collection History</Text>
            {selectedFilterDate ? (
              <TouchableOpacity
                onPress={() => setSelectedFilterDate('')}
                style={styles.clearFilterBtn}
              >
                <Text style={styles.clearFilterText}>Show All Dates ✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          {/* Date Picker Filter Bar */}
          <View style={styles.filterCard}>
            <AppDatePicker
              label="Filter Logs by Specific Date:"
              value={selectedFilterDate}
              onChange={setSelectedFilterDate}
              placeholder="Showing all recorded dates (Tap to select date)"
              showPresets={true}
              allowClear={true}
            />
          </View>

          {displayedRecords.length === 0 ? (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>🥛</Text>
              <Text style={styles.emptyBannerTitle}>
                {selectedFilterDate ? `No Logs for ${formatDateFriendly(selectedFilterDate)}` : 'No Milk Collections Logged'}
              </Text>
              <Text style={styles.emptyBannerSubtitle}>
                {selectedFilterDate
                  ? 'No collection logs match the selected date. Select another date or add a new entry.'
                  : 'Record your bulk tank milk yield in kilograms to monitor daily farm production.'}
              </Text>
              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={() => {
                  if (selectedFilterDate) setRecordDate(selectedFilterDate);
                  setModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionBtnText}>
                  + Record Milk for {selectedFilterDate ? formatDateFriendly(selectedFilterDate) : 'Today'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayedRecords.map((rec) => (
              <View key={rec.id} style={styles.recordCard}>
                <View style={styles.recordHeader}>
                  <View>
                    <Text style={styles.recordDate}>{rec.date}</Text>
                    <Text style={styles.recordSession}>{rec.session} Collection</Text>
                  </View>

                  <View style={styles.rightHeaderAction}>
                    <View style={styles.weightBadge}>
                      <Text style={styles.weightText}>{rec.amountKg} KG</Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteRecord(rec.id, rec.amountKg, rec.date)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {rec.notes ? (
                  <View style={styles.recordFooter}>
                    <Text style={styles.notesText}>Note: {rec.notes}</Text>
                  </View>
                ) : null}
              </View>
            ))
          )}
        </ScrollView>
      )}

      {/* Modal for Logging Bulk Milk */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Bulk Milk Collection</Text>
            <Text style={styles.modalSubtitle}>Save collected milk in Kilograms (KG)</Text>

            <AppDatePicker
              label="Collection Date *"
              value={recordDate}
              onChange={setRecordDate}
              showPresets={true}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Collection Session</Text>
              <View style={styles.sessionToggleRow}>
                <TouchableOpacity
                  style={[
                    styles.sessionToggleBtn,
                    session === 'Morning' && styles.sessionToggleActive,
                  ]}
                  onPress={() => setSession('Morning')}
                >
                  <Text
                    style={[
                      styles.sessionToggleText,
                      session === 'Morning' && styles.sessionToggleTextActive,
                    ]}
                  >
                    🌅 Morning
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.sessionToggleBtn,
                    session === 'Evening' && styles.sessionToggleActive,
                  ]}
                  onPress={() => setSession('Evening')}
                >
                  <Text
                    style={[
                      styles.sessionToggleText,
                      session === 'Evening' && styles.sessionToggleTextActive,
                    ]}
                  >
                    🌆 Evening
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Milk Amount (KG) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 145.5"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={amountKg}
                onChangeText={setAmountKg}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Tank ID (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Tank 1 Morning Batch"
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveBulkMilk}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Collection</Text>
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
  headerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 13,
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
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  summaryCard: {
    width: '48%',
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryIcon: {
    fontSize: 24,
    marginBottom: 6,
  },
  summaryVal: {
    fontSize: 20,
    fontWeight: '800',
    color: '#10B981',
  },
  summaryLbl: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  clearFilterBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  clearFilterText: {
    color: '#F87171',
    fontSize: 12,
    fontWeight: '600',
  },
  filterCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  emptyBannerIcon: {
    fontSize: 44,
    marginBottom: 12,
  },
  emptyBannerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 6,
  },
  emptyBannerSubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 18,
  },
  bannerActionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  bannerActionBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  recordCard: {
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  recordSession: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  rightHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  weightBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  weightText: {
    color: '#34D399',
    fontWeight: '800',
    fontSize: 14,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  recordFooter: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  fatText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  fatVal: {
    color: '#F8FAFC',
    fontWeight: '600',
  },
  notesText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
    fontStyle: 'italic',
  },
  // Modal
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
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#FFFFFF',
  },
  sessionToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  sessionToggleBtn: {
    flex: 0.48,
    backgroundColor: '#0F172A',
    borderColor: '#334155',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  sessionToggleActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  sessionToggleText: {
    color: '#94A3B8',
    fontWeight: '600',
    fontSize: 13,
  },
  sessionToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 16,
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
