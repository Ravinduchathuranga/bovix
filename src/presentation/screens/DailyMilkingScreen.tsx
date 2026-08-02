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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  recordBulkMilkUseCase,
  getMilkRecordsUseCase,
  deleteMilkRecordUseCase,
  getReconciliationUseCase,
  addCompanyReceiptUseCase,
  deleteReceiptUseCase,
} from '../../di/container';
import { BulkMilkRecord, MilkReconciliationComparison } from '../../domain/entities/cattle';
import { AppDatePicker, formatDateFriendly } from '../components/AppDatePicker';
import { DateTabBar } from '../components/DateTabBar';

export const DailyMilkingScreen: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [records, setRecords] = useState<BulkMilkRecord[]>([]);
  const [comparisons, setComparisons] = useState<MilkReconciliationComparison[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronized Selected Date (defaults to today)
  const [selectedFilterDate, setSelectedFilterDate] = useState<string>(todayStr);

  // Bulk Milk Log Modal State
  const [milkModalVisible, setMilkModalVisible] = useState(false);
  const [recordDate, setRecordDate] = useState(todayStr);
  const [session, setSession] = useState<'Morning' | 'Evening'>('Morning');
  const [amountKg, setAmountKg] = useState('');
  const [milkNotes, setMilkNotes] = useState('');
  const [savingMilk, setSavingMilk] = useState(false);

  // Company Paper Slip Modal State
  const [slipModalVisible, setSlipModalVisible] = useState(false);
  const [receiptDate, setReceiptDate] = useState(todayStr);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [companyName, setCompanyName] = useState('Cargills Dairy Co.');
  const [companyScaleKg, setCompanyScaleKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('0.85');
  const [fatPercentage, setFatPercentage] = useState('');
  const [slipNotes, setSlipNotes] = useState('');
  const [savingSlip, setSavingSlip] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [milkData, reconData] = await Promise.all([
        getMilkRecordsUseCase.execute(),
        getReconciliationUseCase.execute(),
      ]);
      setRecords(milkData);
      setComparisons(reconData);
    } catch (err) {
      console.error('Failed to load daily data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Dates that have entries logged
  const datesWithData = Array.from(
    new Set([...records.map((r) => r.date), ...comparisons.map((c) => c.date)])
  );

  const handleSaveBulkMilk = async () => {
    if (!amountKg || isNaN(parseFloat(amountKg))) {
      Alert.alert('Validation Error', 'Please enter a valid milk amount in KG.');
      return;
    }

    setSavingMilk(true);
    try {
      const kg = parseFloat(amountKg);
      await recordBulkMilkUseCase.execute(recordDate, session, kg, milkNotes);

      setMilkModalVisible(false);
      setAmountKg('');
      setMilkNotes('');
      fetchAllData();
      Alert.alert('Success', `Recorded ${kg} KG of bulk milk for ${session} session.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to record milk.');
    } finally {
      setSavingMilk(false);
    }
  };

  const handleSaveReceipt = async () => {
    if (!receiptNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter receipt/slip number.');
      return;
    }
    if (!companyScaleKg || isNaN(parseFloat(companyScaleKg))) {
      Alert.alert('Validation Error', 'Please enter valid scale weight from company receipt in KG.');
      return;
    }

    setSavingSlip(true);
    try {
      const kg = parseFloat(companyScaleKg);
      const price = pricePerKg ? parseFloat(pricePerKg) : undefined;
      const fat = fatPercentage ? parseFloat(fatPercentage) : undefined;

      await addCompanyReceiptUseCase.execute(
        receiptDate,
        receiptNumber,
        companyName,
        kg,
        fat,
        price,
        slipNotes
      );

      setSlipModalVisible(false);
      setReceiptNumber('');
      setCompanyScaleKg('');
      setFatPercentage('');
      setSlipNotes('');
      fetchAllData();
      Alert.alert('Receipt Added', `Logged company scale paper slip #${receiptNumber}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save company receipt.');
    } finally {
      setSavingSlip(false);
    }
  };

  const handleDeleteRecord = (id: string, kg: number, date: string) => {
    Alert.alert('Confirm Delete', `Delete bulk milk record of ${kg} KG from ${date}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMilkRecordUseCase.execute(id);
          fetchAllData();
        },
      },
    ]);
  };

  const handleDeleteReceipt = (id: string, rcpNo: string) => {
    Alert.alert('Delete Slip', `Remove company receipt #${rcpNo}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteReceiptUseCase.execute(id);
          fetchAllData();
        },
      },
    ]);
  };

  // Filtered records logic
  const displayedMilkRecords = selectedFilterDate
    ? records.filter((r) => r.date === selectedFilterDate)
    : records;

  const currentReconciliation = comparisons.find((c) => c.date === selectedFilterDate);

  // Metrics calculations
  const todayRecords = records.filter((r) => r.date === todayStr);
  const todayTotalKg = todayRecords.reduce((acc, r) => acc + r.amountKg, 0);
  const filteredTotalKg = displayedMilkRecords.reduce((acc, r) => acc + r.amountKg, 0);

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Local Log & Compare</Text>
          <Text style={styles.headerSubtitle}>Synchronized Daily Milk & Slip Record</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading Daily Synchronized Data...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Overview Cards */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>🥛</Text>
              <Text style={styles.summaryVal}>{todayTotalKg.toFixed(1)} KG</Text>
              <Text style={styles.summaryLbl}>Today's Production</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>📈</Text>
              <Text style={styles.summaryVal}>{filteredTotalKg.toFixed(1)} KG</Text>
              <Text style={styles.summaryLbl}>
                {selectedFilterDate ? `Logged (${formatDateFriendly(selectedFilterDate)})` : 'All-Time Logged'}
              </Text>
            </View>
          </View>

          {/* Interactive Synchronized Horizontal Date Tab Bar */}
          <DateTabBar
            selectedDate={selectedFilterDate}
            onSelectDate={setSelectedFilterDate}
            datesWithData={datesWithData}
          />

          {/* Synchronized Section Header for Selected Date */}
          <View style={styles.dateSectionCard}>
            <Text style={styles.dateSectionTitle}>
              🗓️ {selectedFilterDate ? formatDateFriendly(selectedFilterDate) : 'All Logged Dates Overview'}
            </Text>

            {/* Reconciliation Comparison Summary for Selected Date */}
            {selectedFilterDate ? (
              <View style={styles.reconSummaryBox}>
                <Text style={styles.reconBoxTitle}>Scale Reconciliation Summary</Text>
                <View style={styles.reconRow}>
                  <View style={styles.reconCol}>
                    <Text style={styles.reconColLbl}>Farm Logged</Text>
                    <Text style={styles.reconColVal}>{filteredTotalKg.toFixed(1)} KG</Text>
                  </View>
                  <Text style={styles.vsBadge}>VS</Text>
                  <View style={styles.reconCol}>
                    <Text style={styles.reconColLbl}>Company Scale</Text>
                    <Text style={styles.reconColVal}>
                      {currentReconciliation?.receipt
                        ? `${currentReconciliation.receipt.companyScaleKg} KG`
                        : 'Pending Slip'}
                    </Text>
                  </View>
                  <View style={styles.reconCol}>
                    <Text style={styles.reconColLbl}>Variance</Text>
                    <Text
                      style={[
                        styles.reconColVal,
                        currentReconciliation?.status === 'match'
                          ? styles.textMatch
                          : currentReconciliation?.status === 'minor_discrepancy'
                            ? styles.textWarn
                            : styles.textAlert,
                      ]}
                    >
                      {currentReconciliation?.differenceKg !== undefined
                        ? `${currentReconciliation.differenceKg > 0 ? '+' : ''}${currentReconciliation.differenceKg} KG`
                        : '-'}
                    </Text>
                  </View>
                </View>

                {currentReconciliation?.receipt ? (
                  <View style={styles.slipDetailBadge}>
                    <Text style={styles.slipDetailText}>
                      Paper Slip #{currentReconciliation.receipt.receiptNumber} • {currentReconciliation.receipt.companyName}
                      {currentReconciliation.receipt.companyFatPercentage !== undefined
                        ? ` • ${currentReconciliation.receipt.companyFatPercentage}% Fat`
                        : ''}
                    </Text>
                    {currentReconciliation.receipt.totalPayout ? (
                      <Text style={styles.payoutText}>
                        Company Payout: RS: {currentReconciliation.receipt.totalPayout.toFixed(2)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            ) : null}
          </View>

          {/* SECTION 1: Local Farm Milk Collection Log */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>1. Local Milk Collection Logs</Text>
          </View>

          {displayedMilkRecords.length === 0 ? (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>🥛</Text>
              <Text style={styles.emptyBannerTitle}>
                {selectedFilterDate
                  ? `No Local Milk Logged for ${formatDateFriendly(selectedFilterDate)}`
                  : 'No Milk Collections Logged'}
              </Text>
              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={() => {
                  setRecordDate(selectedFilterDate || todayStr);
                  setMilkModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionBtnText}>
                  + Record Milk for {selectedFilterDate ? formatDateFriendly(selectedFilterDate) : 'Today'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayedMilkRecords.map((rec) => (
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

          {/* SECTION 2: Company Compare Slip */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>2. Company Paper Compare Slip</Text>
          </View>

          {currentReconciliation?.receipt ? (
            <View style={styles.slipCard}>
              <View style={styles.slipCardHeader}>
                <View>
                  <Text style={styles.slipDate}>{currentReconciliation.date}</Text>
                  <Text style={styles.slipTitle}>
                    Slip #{currentReconciliation.receipt.receiptNumber} • {currentReconciliation.receipt.companyName}
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() =>
                    handleDeleteReceipt(
                      currentReconciliation.receipt!.id,
                      currentReconciliation.receipt!.receiptNumber
                    )
                  }
                  style={styles.deleteBtn}
                >
                  <Text style={styles.deleteBtnText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.slipDetailsGrid}>
                <View style={styles.slipDetailCol}>
                  <Text style={styles.slipDetailLbl}>Scale Weight</Text>
                  <Text style={styles.slipDetailVal}>{currentReconciliation.receipt.companyScaleKg} KG</Text>
                </View>

                {currentReconciliation.receipt.companyFatPercentage !== undefined ? (
                  <View style={styles.slipDetailCol}>
                    <Text style={styles.slipDetailLbl}>Tested Fat</Text>
                    <Text style={styles.slipDetailVal}>{currentReconciliation.receipt.companyFatPercentage}%</Text>
                  </View>
                ) : null}

                {currentReconciliation.receipt.totalPayout ? (
                  <View style={styles.slipDetailCol}>
                    <Text style={styles.slipDetailLbl}>Company Payout</Text>
                    <Text style={styles.slipDetailVal}>RS: {currentReconciliation.receipt.totalPayout.toFixed(2)}</Text>
                  </View>
                ) : null}
              </View>

              {currentReconciliation.receipt.notes ? (
                <Text style={styles.slipNotesText}>Note: {currentReconciliation.receipt.notes}</Text>
              ) : null}
            </View>
          ) : (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>⚖️</Text>
              <Text style={styles.emptyBannerTitle}>
                {selectedFilterDate
                  ? `Awaiting Company Slip for ${formatDateFriendly(selectedFilterDate)}`
                  : 'No Paper Slips Logged'}
              </Text>
              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={() => {
                  setReceiptDate(selectedFilterDate || todayStr);
                  setSlipModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionBtnText}>
                  + Input Paper Slip for {selectedFilterDate ? formatDateFriendly(selectedFilterDate) : 'Today'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal 1: Logging Bulk Milk */}
      <Modal visible={milkModalVisible} animationType="slide" transparent>
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
                value={milkNotes}
                onChangeText={setMilkNotes}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setMilkModalVisible(false)}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveBulkMilk}
                disabled={savingMilk}
              >
                {savingMilk ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Save Entry</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 2: Adding Company Paper Slip */}
      <Modal visible={slipModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Add Company Paper Slip</Text>
            <Text style={styles.modalSubtitle}>
              Input actual milk weight received on dairy company's paper scale receipt
            </Text>

            <AppDatePicker
              label="Slip Date *"
              value={receiptDate}
              onChange={setReceiptDate}
              showPresets={true}
            />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Receipt / Slip No. *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. REC-88912"
                placeholderTextColor="#999"
                value={receiptNumber}
                onChangeText={setReceiptNumber}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Dairy Company Name</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Lactalis Dairy Co."
                placeholderTextColor="#999"
                value={companyName}
                onChangeText={setCompanyName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company Scale Weight (KG) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 278.0"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={companyScaleKg}
                onChangeText={setCompanyScaleKg}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Company Tested Fat (%) (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 4.2"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={fatPercentage}
                onChangeText={setFatPercentage}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Price per KG ($) (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 0.85"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={pricePerKg}
                onChangeText={setPricePerKg}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Quality Remarks (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Received without spillages"
                placeholderTextColor="#999"
                value={slipNotes}
                onChangeText={setSlipNotes}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setSlipModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveReceipt}
                disabled={savingSlip}
              >
                {savingSlip ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Compare Slip</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </KeyboardAvoidingView>
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
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  addBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#94A3B8',
    marginTop: 12,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  summaryVal: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  summaryLbl: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  dateSectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  dateSectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 12,
  },
  reconSummaryBox: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reconBoxTitle: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  reconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  reconCol: {
    alignItems: 'center',
    flex: 1,
  },
  reconColLbl: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  reconColVal: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginTop: 2,
  },
  vsBadge: {
    color: '#10B981',
    fontWeight: '900',
    fontSize: 12,
  },
  textMatch: {
    color: '#34D399',
  },
  textWarn: {
    color: '#FBBF24',
  },
  textAlert: {
    color: '#F87171',
  },
  slipDetailBadge: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#1E293B',
  },
  slipDetailText: {
    color: '#CBD5E1',
    fontSize: 12,
    fontWeight: '600',
  },
  payoutText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  addSlipActionBtn: {
    marginTop: 10,
    backgroundColor: '#064E3B',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  addSlipActionText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  smallAddBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  smallAddBtnText: {
    color: '#38BDF8',
    fontSize: 14,
    fontWeight: '700',
  },
  recordCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordDate: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  recordSession: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  rightHeaderAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  weightBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  weightText: {
    color: '#34D399',
    fontSize: 14,
    fontWeight: '800',
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
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  notesText: {
    color: '#94A3B8',
    fontSize: 12,
    fontStyle: 'italic',
  },
  slipCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  slipCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  slipDate: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  slipTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginTop: 2,
  },
  slipDetailsGrid: {
    flexDirection: 'row',
    gap: 16,
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 10,
  },
  slipDetailCol: {
    flex: 1,
  },
  slipDetailLbl: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  slipDetailVal: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  slipNotesText: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 8,
    fontStyle: 'italic',
  },
  emptyBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyBannerIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyBannerTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  bannerActionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 12,
  },
  bannerActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 20,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  modalInput: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 12,
    color: '#F8FAFC',
    fontSize: 15,
  },
  sessionToggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sessionToggleBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  sessionToggleActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  sessionToggleText: {
    color: '#94A3B8',
    fontSize: 14,
    fontWeight: '700',
  },
  sessionToggleTextActive: {
    color: '#34D399',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: '#334155',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
  },
  submitBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
