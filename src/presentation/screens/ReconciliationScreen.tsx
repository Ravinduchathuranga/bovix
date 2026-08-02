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
  addCompanyReceiptUseCase,
  getReconciliationUseCase,
  deleteReceiptUseCase,
  getMilkRecordsUseCase,
  recordBulkMilkUseCase,
  deleteMilkRecordUseCase,
} from '../../di/container';
import { MilkReconciliationComparison, BulkMilkRecord } from '../../domain/entities/cattle';
import { AppDatePicker, formatDateFriendly } from '../components/AppDatePicker';
import { DateTabBar } from '../components/DateTabBar';

export const ReconciliationScreen: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [comparisons, setComparisons] = useState<MilkReconciliationComparison[]>([]);
  const [milkRecords, setMilkRecords] = useState<BulkMilkRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Synchronized Selected Date (defaults to today)
  const [selectedFilterDate, setSelectedFilterDate] = useState<string>(todayStr);

  // Company Paper Slip Modal state
  const [slipModalVisible, setSlipModalVisible] = useState(false);
  const [receiptDate, setReceiptDate] = useState(todayStr);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [companyName, setCompanyName] = useState('Cargills Dairy Co.');
  const [companyScaleKg, setCompanyScaleKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('0.85');
  const [fatPercentage, setFatPercentage] = useState('');
  const [slipNotes, setSlipNotes] = useState('');
  const [savingSlip, setSavingSlip] = useState(false);

  // Local Milk Log Modal state
  const [milkModalVisible, setMilkModalVisible] = useState(false);
  const [recordDate, setRecordDate] = useState(todayStr);
  const [session, setSession] = useState<'Morning' | 'Evening'>('Morning');
  const [amountKg, setAmountKg] = useState('');
  const [milkNotes, setMilkNotes] = useState('');
  const [savingMilk, setSavingMilk] = useState(false);

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [reconData, milkData] = await Promise.all([
        getReconciliationUseCase.execute(),
        getMilkRecordsUseCase.execute(),
      ]);
      setComparisons(reconData);
      setMilkRecords(milkData);
    } catch (err) {
      console.error('Failed to load reconciliation data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Dates that have entries logged
  const datesWithData = Array.from(
    new Set([...comparisons.map((c) => c.date), ...milkRecords.map((m) => m.date)])
  );

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

  const handleDeleteMilkRecord = (id: string, kg: number, date: string) => {
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

  // Filtered comparisons logic
  const displayedComparisons = selectedFilterDate
    ? comparisons.filter((c) => c.date === selectedFilterDate)
    : comparisons;

  const currentReconciliation = comparisons.find((c) => c.date === selectedFilterDate);

  const displayedMilkRecords = selectedFilterDate
    ? milkRecords.filter((m) => m.date === selectedFilterDate)
    : milkRecords;

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Compare Slip & Audit</Text>
          <Text style={styles.headerSubtitle}>Scale Weight & Payout Discrepancy Tool</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setReceiptDate(selectedFilterDate || todayStr);
            setSlipModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Compare Slip</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Calculating Scale Variance & Slips...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Interactive Synchronized Horizontal Date Tab Bar */}
          <DateTabBar
            selectedDate={selectedFilterDate}
            onSelectDate={setSelectedFilterDate}
            datesWithData={datesWithData}
          />

          {/* Synchronized Date Summary Card */}
          <View style={styles.reconSummaryBox}>
            <Text style={styles.reconBoxTitle}>
              🗓️ {selectedFilterDate ? formatDateFriendly(selectedFilterDate) : 'All Logged Dates Scale Reconciliation'}
            </Text>

            {selectedFilterDate && currentReconciliation ? (
              <>
                <View style={styles.reconRow}>
                  <View style={styles.reconCol}>
                    <Text style={styles.reconColLbl}>Farm Logged</Text>
                    <Text style={styles.reconColVal}>{currentReconciliation.farmLoggedKg} KG</Text>
                  </View>
                  <Text style={styles.vsBadge}>VS</Text>
                  <View style={styles.reconCol}>
                    <Text style={styles.reconColLbl}>Company Scale</Text>
                    <Text style={styles.reconColVal}>
                      {currentReconciliation.receipt
                        ? `${currentReconciliation.receipt.companyScaleKg} KG`
                        : 'Pending Slip'}
                    </Text>
                  </View>
                  <View style={styles.reconCol}>
                    <Text style={styles.reconColLbl}>Scale Variance</Text>
                    <Text
                      style={[
                        styles.reconColVal,
                        currentReconciliation.status === 'match'
                          ? styles.textMatch
                          : currentReconciliation.status === 'minor_discrepancy'
                          ? styles.textWarn
                          : styles.textAlert,
                      ]}
                    >
                      {currentReconciliation.differenceKg > 0 ? '+' : ''}
                      {currentReconciliation.differenceKg} KG
                    </Text>
                  </View>
                </View>

                {currentReconciliation.receipt ? (
                  <View
                    style={[
                      styles.statusBanner,
                      currentReconciliation.status === 'match'
                        ? styles.bgMatch
                        : currentReconciliation.status === 'minor_discrepancy'
                        ? styles.bgWarn
                        : styles.bgAlert,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        currentReconciliation.status === 'match'
                          ? styles.textMatch
                          : currentReconciliation.status === 'minor_discrepancy'
                          ? styles.textWarn
                          : styles.textAlert,
                      ]}
                    >
                      {currentReconciliation.status === 'match'
                        ? `✅ Exact Match / Low Variance (${currentReconciliation.differenceKg > 0 ? '+' : ''}${currentReconciliation.differenceKg} KG, ${currentReconciliation.variancePercentage}%)`
                        : currentReconciliation.status === 'minor_discrepancy'
                        ? `⚠️ Minor Scale Diff: ${currentReconciliation.differenceKg > 0 ? '+' : ''}${currentReconciliation.differenceKg} KG (${currentReconciliation.variancePercentage}%)`
                        : `🚨 Discrepancy Alert: ${currentReconciliation.differenceKg} KG difference! (${currentReconciliation.variancePercentage}%)`}
                    </Text>

                    {currentReconciliation.receipt.companyFatPercentage !== undefined ? (
                      <Text style={styles.payoutText}>
                        Company Tested Fat: {currentReconciliation.receipt.companyFatPercentage}%
                      </Text>
                    ) : null}

                    {currentReconciliation.receipt.totalPayout ? (
                      <Text style={styles.payoutText}>
                        Company Payout: RS: {currentReconciliation.receipt.totalPayout.toFixed(2)}
                      </Text>
                    ) : null}
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.addSlipActionBtn}
                    onPress={() => {
                      setReceiptDate(selectedFilterDate);
                      setSlipModalVisible(true);
                    }}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.addSlipActionText}>+ Add Paper Slip for {formatDateFriendly(selectedFilterDate)}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <Text style={styles.emptyText}>Select a date from the date bar above to view detailed scale reconciliation.</Text>
            )}
          </View>

          {/* SECTION 1: Company Paper Compare Slips */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>1. Company Paper Compare Slips</Text>
            <TouchableOpacity
              style={styles.smallAddBtn}
              onPress={() => {
                setReceiptDate(selectedFilterDate || todayStr);
                setSlipModalVisible(true);
              }}
            >
              <Text style={styles.smallAddBtnText}>+ Add Slip</Text>
            </TouchableOpacity>
          </View>

          {displayedComparisons.length === 0 ? (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>⚖️</Text>
              <Text style={styles.emptyBannerTitle}>
                {selectedFilterDate
                  ? `No Paper Slip for ${formatDateFriendly(selectedFilterDate)}`
                  : 'No Company Paper Slips Recorded'}
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
                  + Add Paper Slip for {selectedFilterDate ? formatDateFriendly(selectedFilterDate) : 'Today'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayedComparisons.map((item) => {
              const hasReceipt = !!item.receipt;
              return (
                <View key={item.date} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View>
                      <Text style={styles.cardDate}>{item.date}</Text>
                      {hasReceipt ? (
                        <Text style={styles.receiptNo}>
                          Slip #{item.receipt?.receiptNumber} • {item.receipt?.companyName}
                          {item.receipt?.companyFatPercentage !== undefined
                            ? ` • ${item.receipt.companyFatPercentage}% Fat`
                            : ''}
                        </Text>
                      ) : (
                        <Text style={styles.noReceiptText}>⚠️ Awaiting Company Receipt Slip</Text>
                      )}
                    </View>

                    {hasReceipt && (
                      <TouchableOpacity
                        onPress={() =>
                          handleDeleteReceipt(item.receipt!.id, item.receipt!.receiptNumber)
                        }
                        style={styles.deleteBtn}
                      >
                        <Text style={styles.deleteBtnText}>✕</Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Comparison Columns */}
                  <View style={styles.comparisonRow}>
                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Farm Logged</Text>
                      <Text style={styles.colVal}>{item.farmLoggedKg} KG</Text>
                    </View>

                    <View style={styles.vsBox}>
                      <Text style={styles.vsText}>VS</Text>
                    </View>

                    <View style={styles.col}>
                      <Text style={styles.colLabel}>Company Weight</Text>
                      <Text style={styles.colVal}>
                        {hasReceipt ? `${item.companyReceiptKg} KG` : 'Pending'}
                      </Text>
                    </View>
                  </View>

                  {/* Variance Status Banner */}
                  {hasReceipt && (
                    <View
                      style={[
                        styles.statusBanner,
                        item.status === 'match'
                          ? styles.bgMatch
                          : item.status === 'minor_discrepancy'
                          ? styles.bgWarn
                          : styles.bgAlert,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          item.status === 'match'
                            ? styles.textMatch
                            : item.status === 'minor_discrepancy'
                            ? styles.textWarn
                            : styles.textAlert,
                        ]}
                      >
                        {item.status === 'match'
                          ? `✅ Exact Match / Low Variance (${item.differenceKg > 0 ? '+' : ''}${item.differenceKg} KG, ${item.variancePercentage}%)`
                          : item.status === 'minor_discrepancy'
                          ? `⚠️ Minor Scale Diff: ${item.differenceKg > 0 ? '+' : ''}${item.differenceKg} KG (${item.variancePercentage}%)`
                          : `🚨 Discrepancy Alert: ${item.differenceKg} KG difference! (${item.variancePercentage}%)`}
                      </Text>

                      {item.receipt?.companyFatPercentage !== undefined ? (
                        <Text style={styles.payoutText}>
                          Company Tested Fat: {item.receipt.companyFatPercentage}%
                        </Text>
                      ) : null}

                      {item.receipt?.totalPayout ? (
                        <Text style={styles.payoutText}>
                          Company Payout: RS: {item.receipt.totalPayout.toFixed(2)}
                        </Text>
                      ) : null}
                    </View>
                  )}
                </View>
              );
            })
          )}

          {/* SECTION 2: Local Farm Milk Collection Log under same date section */}
          <View style={[styles.sectionHeaderRow, { marginTop: 24 }]}>
            <Text style={styles.sectionTitle}>2. Local Milk Collection Logs</Text>
            <TouchableOpacity
              style={styles.smallAddBtn}
              onPress={() => {
                setRecordDate(selectedFilterDate || todayStr);
                setMilkModalVisible(true);
              }}
            >
              <Text style={styles.smallAddBtnText}>+ Log Yield</Text>
            </TouchableOpacity>
          </View>

          {displayedMilkRecords.length === 0 ? (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>🥛</Text>
              <Text style={styles.emptyBannerTitle}>
                {selectedFilterDate
                  ? `No Local Milk Logged for ${formatDateFriendly(selectedFilterDate)}`
                  : 'No Local Milk Collections Recorded'}
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
                      onPress={() => handleDeleteMilkRecord(rec.id, rec.amountKg, rec.date)}
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

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal 1: Adding Company Paper Slip */}
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

      {/* Modal 2: Logging Bulk Milk */}
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
  reconSummaryBox: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  reconBoxTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
  },
  reconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
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
  emptyText: {
    color: '#94A3B8',
    fontSize: 13,
    fontStyle: 'italic',
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
    fontSize: 12,
    fontWeight: '700',
  },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  cardDate: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  receiptNo: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
    marginTop: 2,
  },
  noReceiptText: {
    color: '#F59E0B',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  deleteBtn: {
    padding: 4,
  },
  deleteBtnText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '700',
  },
  comparisonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginVertical: 4,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  colLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  colVal: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  vsBox: {
    paddingHorizontal: 8,
  },
  vsText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '800',
  },
  statusBanner: {
    marginTop: 12,
    padding: 10,
    borderRadius: 10,
  },
  bgMatch: {
    backgroundColor: '#064E3B',
  },
  bgWarn: {
    backgroundColor: '#451A03',
  },
  bgAlert: {
    backgroundColor: '#450A0A',
  },
  statusText: {
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
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
  payoutText: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: 4,
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
