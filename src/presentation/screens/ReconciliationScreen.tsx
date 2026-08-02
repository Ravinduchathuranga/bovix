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
  addCompanyReceiptUseCase,
  getReconciliationUseCase,
  deleteReceiptUseCase,
} from '../../di/container';
import { MilkReconciliationComparison } from '../../domain/entities/cattle';
import { AppDatePicker, formatDateFriendly } from '../components/AppDatePicker';

export const ReconciliationScreen: React.FC = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [comparisons, setComparisons] = useState<MilkReconciliationComparison[]>([]);
  const [loading, setLoading] = useState(true);

  // Date Filter State
  const [selectedFilterDate, setSelectedFilterDate] = useState<string>('');

  // Form Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [receiptDate, setReceiptDate] = useState(todayStr);
  const [receiptNumber, setReceiptNumber] = useState('');
  const [companyName, setCompanyName] = useState('Cargills Dairy Co.');
  const [companyScaleKg, setCompanyScaleKg] = useState('');
  const [pricePerKg, setPricePerKg] = useState('0.85');
  const [fatPercentage, setFatPercentage] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchReconciliationData = async () => {
    setLoading(true);
    try {
      const data = await getReconciliationUseCase.execute();
      setComparisons(data);
    } catch (err) {
      console.error('Failed to load reconciliation comparison:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReconciliationData();
  }, []);

  const handleSaveReceipt = async () => {
    if (!receiptNumber.trim()) {
      Alert.alert('Validation Error', 'Please enter receipt/slip number.');
      return;
    }
    if (!companyScaleKg || isNaN(parseFloat(companyScaleKg))) {
      Alert.alert('Validation Error', 'Please enter valid scale weight from company receipt in KG.');
      return;
    }

    setSaving(true);
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
        notes
      );

      setModalVisible(false);
      setReceiptNumber('');
      setCompanyScaleKg('');
      setFatPercentage('');
      setNotes('');
      fetchReconciliationData();
      Alert.alert('Receipt Added', `Logged company scale paper slip #${receiptNumber}`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to save company receipt.');
    } finally {
      setSaving(false);
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
          fetchReconciliationData();
        },
      },
    ]);
  };

  // Filtered comparisons logic
  const displayedComparisons = selectedFilterDate
    ? comparisons.filter((c) => c.date === selectedFilterDate)
    : comparisons;

  // Metric aggregates
  const totalFarmLoggedKg = displayedComparisons.reduce((acc, c) => acc + c.farmLoggedKg, 0);
  const totalCompanyReceiptKg = displayedComparisons.reduce((acc, c) => acc + c.companyReceiptKg, 0);
  const totalDiffKg = Math.round((totalCompanyReceiptKg - totalFarmLoggedKg) * 10) / 10;

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Scale Comparison</Text>
          <Text style={styles.headerSubtitle}>Farm Scale vs Company Slip Weight</Text>
        </View>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => {
            setReceiptDate(todayStr);
            setModalVisible(true);
          }}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Log Slip</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Comparing Scale Records...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Audit Card */}
          <View style={styles.auditCard}>
            <Text style={styles.auditTitle}>
              ⚖️ {selectedFilterDate ? `Variance Summary (${formatDateFriendly(selectedFilterDate)})` : 'Total Scale Variance Summary'}
            </Text>
            <View style={styles.auditGrid}>
              <View style={styles.auditItem}>
                <Text style={styles.auditVal}>{totalFarmLoggedKg.toFixed(1)} KG</Text>
                <Text style={styles.auditLbl}>Your Farm Scale</Text>
              </View>
              <View style={styles.auditDivider} />
              <View style={styles.auditItem}>
                <Text style={styles.auditVal}>{totalCompanyReceiptKg.toFixed(1)} KG</Text>
                <Text style={styles.auditLbl}>Company Receipt</Text>
              </View>
              <View style={styles.auditDivider} />
              <View style={styles.auditItem}>
                <Text
                  style={[
                    styles.auditVal,
                    { color: totalDiffKg < 0 ? '#F87171' : totalDiffKg > 0 ? '#34D399' : '#F8FAFC' },
                  ]}
                >
                  {totalDiffKg > 0 ? `+${totalDiffKg}` : totalDiffKg} KG
                </Text>
                <Text style={styles.auditLbl}>Net Difference</Text>
              </View>
            </View>
          </View>

          {/* Header & Date Filter Bar */}
          <View style={styles.sectionHeaderRow}>
            <Text style={styles.sectionTitle}>Daily Reconciliation Logs</Text>
            {selectedFilterDate ? (
              <TouchableOpacity
                onPress={() => setSelectedFilterDate('')}
                style={styles.clearFilterBtn}
              >
                <Text style={styles.clearFilterText}>Show All Dates ✕</Text>
              </TouchableOpacity>
            ) : null}
          </View>

          <View style={styles.filterCard}>
            <AppDatePicker
              label="Select Date to Compare Scale Records:"
              value={selectedFilterDate}
              onChange={setSelectedFilterDate}
              placeholder="Showing all dates (Tap to select specific date)"
              showPresets={true}
              allowClear={true}
            />
          </View>

          {displayedComparisons.length === 0 ? (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>⚖️</Text>
              <Text style={styles.emptyBannerTitle}>
                {selectedFilterDate ? `No Logs for ${formatDateFriendly(selectedFilterDate)}` : 'No Receipts Logged'}
              </Text>
              <Text style={styles.emptyBannerSubtitle}>
                {selectedFilterDate
                  ? 'No reconciliation records match the selected date. Add a company paper slip or select another date.'
                  : 'Add company paper slips to compare farm tank weight against official factory receipts.'}
              </Text>
              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={() => {
                  if (selectedFilterDate) setReceiptDate(selectedFilterDate);
                  setModalVisible(true);
                }}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionBtnText}>
                  + Log Company Paper Slip for {selectedFilterDate ? formatDateFriendly(selectedFilterDate) : 'Today'}
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
                          {item.receipt?.companyFatPercentage !== undefined ? ` • ${item.receipt.companyFatPercentage}% Fat` : ''}
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
                          ? `✅ Exact Match / Low Variance (${item.differenceKg > 0 ? '+' : ''}${item.differenceKg
                          } KG, ${item.variancePercentage}%)`
                          : item.status === 'minor_discrepancy'
                            ? `⚠️ Minor Scale Diff: ${item.differenceKg > 0 ? '+' : ''}${item.differenceKg
                            } KG (${item.variancePercentage}%)`
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
        </ScrollView>
      )}

      {/* Add Company Receipt Modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
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

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleSaveReceipt}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <Text style={styles.submitBtnText}>Compare Slip</Text>
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
  auditCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#334155',
  },
  auditTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 12,
  },
  auditGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  auditItem: {
    alignItems: 'center',
  },
  auditVal: {
    fontSize: 18,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  auditLbl: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
  },
  auditDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#334155',
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
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
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
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  receiptNo: {
    fontSize: 12,
    color: '#10B981',
    marginTop: 2,
    fontWeight: '600',
  },
  noReceiptText: {
    fontSize: 12,
    color: '#F59E0B',
    marginTop: 2,
    fontStyle: 'italic',
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
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  col: {
    flex: 1,
    alignItems: 'center',
  },
  colLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 4,
  },
  colVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  vsBox: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  vsText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '800',
  },
  statusBanner: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    flexDirection: 'column',
  },
  bgMatch: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  bgWarn: {
    backgroundColor: '#45300B',
    borderColor: '#F59E0B',
  },
  bgAlert: {
    backgroundColor: '#451A1A',
    borderColor: '#EF4444',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  textMatch: {
    color: '#A7F3D0',
  },
  textWarn: {
    color: '#FDE68A',
  },
  textAlert: {
    color: '#FCA5A5',
  },
  payoutText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
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
