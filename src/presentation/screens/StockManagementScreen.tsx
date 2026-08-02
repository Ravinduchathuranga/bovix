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
  getStockItemsUseCase,
  addStockItemUseCase,
  refillStockUseCase,
  deleteStockItemUseCase,
  recordFeedUsageUseCase,
} from '../../di/container';
import { Feather } from '@expo/vector-icons';
import { FeedCategory, FeedStockItem, FeedUnit } from '../../domain/entities/stock';
import { AppDatePicker } from '../components/AppDatePicker';

interface StockManagementScreenProps {}

export const StockManagementScreen: React.FC<StockManagementScreenProps> = () => {
  const todayStr = new Date().toISOString().split('T')[0];

  const [stockItems, setStockItems] = useState<FeedStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  // Modal 1: Add New Stock Form
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState<FeedCategory>('Silage');
  const [currentStockKg, setCurrentStockKg] = useState('');
  const [unit, setUnit] = useState<FeedUnit>('KG');
  const [minThresholdKg, setMinThresholdKg] = useState('100');
  const [costPerUnit, setCostPerUnit] = useState('');
  const [supplierName, setSupplierName] = useState('');
  const [notes, setNotes] = useState('');
  const [savingAdd, setSavingAdd] = useState(false);

  // Modal 2: Refill Stock Form
  const [refillModalVisible, setRefillModalVisible] = useState(false);
  const [targetItem, setTargetItem] = useState<FeedStockItem | null>(null);
  const [refillAmount, setRefillAmount] = useState('');
  const [savingRefill, setSavingRefill] = useState(false);

  // Modal 3: Log Feed Usage Form
  const [usageModalVisible, setUsageModalVisible] = useState(false);
  const [usageDate, setUsageDate] = useState(todayStr);
  const [usageSession, setUsageSession] = useState<'Morning' | 'Evening' | 'Full Day'>('Full Day');
  const [usedAmount, setUsedAmount] = useState('');
  const [usageNotes, setUsageNotes] = useState('');
  const [savingUsage, setSavingUsage] = useState(false);

  const fetchStockData = async () => {
    setLoading(true);
    try {
      const items = await getStockItemsUseCase.execute();
      setStockItems(items);
    } catch (err) {
      console.error('Failed to load stock items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockData();
  }, []);

  const handleAddStock = async () => {
    if (!name.trim()) {
      Alert.alert('Validation Error', 'Please enter feed name.');
      return;
    }
    if (!currentStockKg || isNaN(parseFloat(currentStockKg))) {
      Alert.alert('Validation Error', 'Please enter initial stock quantity.');
      return;
    }

    setSavingAdd(true);
    try {
      const stock = parseFloat(currentStockKg);
      const threshold = minThresholdKg ? parseFloat(minThresholdKg) : 50;
      const cost = costPerUnit ? parseFloat(costPerUnit) : undefined;

      await addStockItemUseCase.execute(
        name,
        category,
        stock,
        unit,
        threshold,
        cost,
        supplierName,
        notes
      );

      setAddModalVisible(false);
      setName('');
      setCurrentStockKg('');
      setCostPerUnit('');
      setSupplierName('');
      setNotes('');
      fetchStockData();
      Alert.alert('Success', `Added "${name}" to farm stock.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to add stock item.');
    } finally {
      setSavingAdd(false);
    }
  };

  const handleRefillStock = async () => {
    if (!targetItem) return;
    if (!refillAmount || isNaN(parseFloat(refillAmount))) {
      Alert.alert('Validation Error', 'Please enter valid refill quantity.');
      return;
    }

    setSavingRefill(true);
    try {
      const amount = parseFloat(refillAmount);
      await refillStockUseCase.execute(targetItem.id, targetItem.currentStockKg, amount);

      setRefillModalVisible(false);
      setTargetItem(null);
      setRefillAmount('');
      fetchStockData();
      Alert.alert('Stock Refilled', `Added ${amount} ${targetItem.unit} to ${targetItem.name}.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to refill stock.');
    } finally {
      setSavingRefill(false);
    }
  };

  const handleLogUsage = async () => {
    if (!targetItem) return;
    if (!usedAmount || isNaN(parseFloat(usedAmount))) {
      Alert.alert('Validation Error', 'Please enter valid amount used.');
      return;
    }

    setSavingUsage(true);
    try {
      const used = parseFloat(usedAmount);
      await recordFeedUsageUseCase.execute(
        targetItem.id,
        targetItem.name,
        targetItem.currentStockKg,
        used,
        usageDate,
        usageSession,
        usageNotes
      );

      setUsageModalVisible(false);
      setTargetItem(null);
      setUsedAmount('');
      setUsageNotes('');
      fetchStockData();
      Alert.alert('Usage Logged', `Recorded ${used} ${targetItem.unit} feed consumption.`);
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to log usage.');
    } finally {
      setSavingUsage(false);
    }
  };

  const handleDeleteItem = (id: string, itemName: string) => {
    Alert.alert('Confirm Delete', `Permanently delete feed item "${itemName}" from inventory?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteStockItemUseCase.execute(id);
          fetchStockData();
        },
      },
    ]);
  };

  // Metrics calculations
  const lowStockItems = stockItems.filter((i) => i.currentStockKg <= i.minThresholdKg);
  const totalValuationRS = stockItems.reduce(
    (acc, i) => acc + i.currentStockKg * (i.costPerUnit || 0),
    0
  );

  const displayedItems =
    selectedCategory === 'ALL'
      ? stockItems
      : stockItems.filter((i) => i.category.toUpperCase() === selectedCategory.toUpperCase());

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Farm Stock & Feed</Text>
          <Text style={styles.headerSubtitle}>Feed Inventory & Usage Tracking</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => setAddModalVisible(true)}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+ Add Feed</Text>
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
          <Text style={styles.loadingText}>Loading Feed Inventory...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Summary Overview Cards */}
          <View style={styles.summaryGrid}>
            <View style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>🌾</Text>
              <Text style={styles.summaryVal}>{stockItems.length}</Text>
              <Text style={styles.summaryLbl}>Feed Types</Text>
            </View>

            <View
              style={[
                styles.summaryCard,
                lowStockItems.length > 0 && { borderColor: '#EF4444', backgroundColor: '#3B1215' },
              ]}
            >
              <Text style={styles.summaryIcon}>⚠️</Text>
              <Text
                style={[
                  styles.summaryVal,
                  lowStockItems.length > 0 && { color: '#F87171' },
                ]}
              >
                {lowStockItems.length}
              </Text>
              <Text style={styles.summaryLbl}>Low Stock Alerts</Text>
            </View>

            <View style={styles.summaryCard}>
              <Text style={styles.summaryIcon}>💰</Text>
              <Text style={styles.summaryVal}>RS: {totalValuationRS.toFixed(0)}</Text>
              <Text style={styles.summaryLbl}>Est. Stock Value</Text>
            </View>
          </View>

          {/* Low Stock Warning Banner */}
          {lowStockItems.length > 0 && (
            <View style={styles.alertBanner}>
              <Text style={styles.alertTitle}>⚠️ LOW STOCK WARNING!</Text>
              <Text style={styles.alertSubtitle}>
                The following feed items are at or below minimum threshold:
              </Text>
              {lowStockItems.map((item) => (
                <View key={item.id} style={styles.alertRow}>
                  <Text style={styles.alertItemName}>
                    • {item.name}: <Text style={styles.alertStockVal}>{item.currentStockKg} {item.unit}</Text> (Min: {item.minThresholdKg} {item.unit})
                  </Text>
                  <TouchableOpacity
                    style={styles.alertRefillBtn}
                    onPress={() => {
                      setTargetItem(item);
                      setRefillModalVisible(true);
                    }}
                  >
                    <Text style={styles.alertRefillText}>+ Refill</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Category Filter Horizontal Scroll */}
          <View style={styles.categoryRow}>
            {['ALL', 'Silage', 'Concentrate', 'Forage', 'Supplement', 'Other'].map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                  onPress={() => setSelectedCategory(cat)}
                >
                  <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Inventory Items List */}
          {displayedItems.length === 0 ? (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>🌾</Text>
              <Text style={styles.emptyBannerTitle}>No Feed Items in Inventory</Text>
              <Text style={styles.emptyBannerSubtitle}>
                Add cow feed stock (silage, concentrates, hay) to monitor stock levels and consumption.
              </Text>
              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={() => setAddModalVisible(true)}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionBtnText}>+ Add First Feed Item</Text>
              </TouchableOpacity>
            </View>
          ) : (
            displayedItems.map((item) => {
              const isLow = item.currentStockKg <= item.minThresholdKg;

              return (
                <View key={item.id} style={[styles.stockCard, isLow && styles.stockCardLow]}>
                  <View style={styles.cardHeader}>
                    <View>
                      <View style={styles.titleCatRow}>
                        <Text style={styles.stockTitle}>{item.name}</Text>
                        <View style={styles.catBadge}>
                          <Text style={styles.catBadgeText}>{item.category}</Text>
                        </View>
                      </View>
                      {item.supplierName ? (
                        <Text style={styles.supplierText}>Supplier: {item.supplierName}</Text>
                      ) : null}
                    </View>

                    <TouchableOpacity
                      onPress={() => handleDeleteItem(item.id, item.name)}
                      style={styles.deleteBtn}
                    >
                      <Text style={styles.deleteBtnText}>✕</Text>
                    </TouchableOpacity>
                  </View>

                  {/* Stock Quantity Display */}
                  <View style={styles.stockLevelRow}>
                    <View>
                      <Text style={styles.stockLevelLbl}>Available Quantity</Text>
                      <Text style={[styles.stockLevelVal, isLow && styles.textLow]}>
                        {item.currentStockKg} <Text style={styles.unitText}>{item.unit}</Text>
                      </Text>
                    </View>

                    <View style={styles.thresholdBox}>
                      <Text style={styles.thresholdLbl}>Min Alert Threshold</Text>
                      <Text style={styles.thresholdVal}>{item.minThresholdKg} {item.unit}</Text>
                    </View>
                  </View>

                  {/* Price & Notes Footer */}
                  <View style={styles.cardFooter}>
                    {item.costPerUnit ? (
                      <Text style={styles.priceText}>Est. Price: RS {item.costPerUnit}/{item.unit}</Text>
                    ) : (
                      <Text style={styles.priceText}>Cost not specified</Text>
                    )}

                    <View style={styles.cardActionGroup}>
                      <TouchableOpacity
                        style={styles.usageBtn}
                        onPress={() => {
                          setTargetItem(item);
                          setUsageModalVisible(true);
                        }}
                      >
                        <Text style={styles.usageBtnText}>- Log Usage</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={styles.refillBtn}
                        onPress={() => {
                          setTargetItem(item);
                          setRefillModalVisible(true);
                        }}
                      >
                        <Text style={styles.refillBtnText}>+ Refill</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>
              );
            })
          )}

          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* Modal 1: Add Stock Item */}
      <Modal visible={addModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.modalTitle}>Add Feed to Inventory</Text>
            <Text style={styles.modalSubtitle}>Enter cow feed details and initial stock quantity</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Feed Name *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Napier Grass Silage Batch #2"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Category</Text>
              <View style={styles.categoryToggleRow}>
                {(['Silage', 'Concentrate', 'Forage', 'Supplement', 'Other'] as FeedCategory[]).map(
                  (c) => (
                    <TouchableOpacity
                      key={c}
                      style={[styles.catToggleBtn, category === c && styles.catToggleActive]}
                      onPress={() => setCategory(c)}
                    >
                      <Text style={[styles.catToggleText, category === c && styles.catToggleTextActive]}>
                        {c}
                      </Text>
                    </TouchableOpacity>
                  )
                )}
              </View>
            </View>

            <View style={styles.rowTwoInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Initial Quantity *</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 1500"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={currentStockKg}
                  onChangeText={setCurrentStockKg}
                />
              </View>

              <View style={[styles.inputGroup, { width: 100 }]}>
                <Text style={styles.inputLabel}>Unit</Text>
                <View style={styles.unitRow}>
                  {(['KG', 'Bags', 'Tons'] as FeedUnit[]).map((u) => (
                    <TouchableOpacity
                      key={u}
                      style={[styles.unitBtn, unit === u && styles.unitBtnActive]}
                      onPress={() => setUnit(u)}
                    >
                      <Text style={[styles.unitBtnText, unit === u && styles.unitBtnTextActive]}>
                        {u}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </View>

            <View style={styles.rowTwoInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Min Alert Threshold</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 200"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={minThresholdKg}
                  onChangeText={setMinThresholdKg}
                />
              </View>

              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.inputLabel}>Price / Unit (RS)</Text>
                <TextInput
                  style={styles.modalInput}
                  placeholder="e.g. 45"
                  placeholderTextColor="#999"
                  keyboardType="numeric"
                  value={costPerUnit}
                  onChangeText={setCostPerUnit}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Supplier / Brand (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Agro Feeds Ltd."
                placeholderTextColor="#999"
                value={supplierName}
                onChangeText={setSupplierName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes / Batch Info (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Stored in Shed 3"
                placeholderTextColor="#999"
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setAddModalVisible(false)}>
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.submitBtn} onPress={handleAddStock} disabled={savingAdd}>
                {savingAdd ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Add Feed</Text>}
              </TouchableOpacity>
            </View>
            <View style={{ height: 24 }} />
          </ScrollView>
        </View>
      </Modal>

      {/* Modal 2: Refill Stock */}
      <Modal visible={refillModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Refill Feed Stock</Text>
            <Text style={styles.modalSubtitle}>
              Adding incoming inventory for "{targetItem?.name}"
            </Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Refill Amount ({targetItem?.unit || 'KG'}) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 500"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={refillAmount}
                onChangeText={setRefillAmount}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setRefillModalVisible(false);
                  setTargetItem(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleRefillStock}
                disabled={savingRefill}
              >
                {savingRefill ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Confirm Refill</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal 3: Log Feed Usage */}
      <Modal visible={usageModalVisible} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Log Daily Feed Usage</Text>
            <Text style={styles.modalSubtitle}>
              Record feed consumed for "{targetItem?.name}"
            </Text>

            <AppDatePicker label="Consumption Date *" value={usageDate} onChange={setUsageDate} />

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Session</Text>
              <View style={styles.sessionRow}>
                {(['Morning', 'Evening', 'Full Day'] as const).map((s) => (
                  <TouchableOpacity
                    key={s}
                    style={[styles.sessionBtn, usageSession === s && styles.sessionBtnActive]}
                    onPress={() => setUsageSession(s)}
                  >
                    <Text style={[styles.sessionBtnText, usageSession === s && styles.sessionBtnTextActive]}>
                      {s}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Amount Used ({targetItem?.unit || 'KG'}) *</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. 120"
                placeholderTextColor="#999"
                keyboardType="numeric"
                value={usedAmount}
                onChangeText={setUsedAmount}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Notes (Optional)</Text>
              <TextInput
                style={styles.modalInput}
                placeholder="e.g. Fed to lactating cows"
                placeholderTextColor="#999"
                value={usageNotes}
                onChangeText={setUsageNotes}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => {
                  setUsageModalVisible(false);
                  setTargetItem(null);
                }}
              >
                <Text style={styles.cancelBtnText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.submitBtn}
                onPress={handleLogUsage}
                disabled={savingUsage}
              >
                {savingUsage ? <ActivityIndicator color="#FFF" /> : <Text style={styles.submitBtnText}>Deduct & Log</Text>}
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
    color: '#F8FAFC',
    fontSize: 22,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  settingsBtn: {
    backgroundColor: '#1E293B',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  settingsBtnText: {
    fontSize: 16,
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
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  summaryIcon: {
    fontSize: 18,
    marginBottom: 2,
  },
  summaryVal: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  summaryLbl: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  alertBanner: {
    backgroundColor: '#450A0A',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  alertTitle: {
    color: '#F87171',
    fontSize: 14,
    fontWeight: '800',
  },
  alertSubtitle: {
    color: '#FCA5A5',
    fontSize: 12,
    marginVertical: 4,
  },
  alertRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  alertItemName: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  alertStockVal: {
    color: '#EF4444',
    fontWeight: '800',
  },
  alertRefillBtn: {
    backgroundColor: '#991B1B',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  alertRefillText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  categoryChipActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  categoryChipText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  stockCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  stockCardLow: {
    borderColor: '#EF4444',
    backgroundColor: '#1C1619',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  titleCatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  catBadge: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  catBadgeText: {
    color: '#38BDF8',
    fontSize: 11,
    fontWeight: '700',
  },
  supplierText: {
    color: '#94A3B8',
    fontSize: 12,
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
  stockLevelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    padding: 12,
    borderRadius: 12,
    marginVertical: 12,
  },
  stockLevelLbl: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  stockLevelVal: {
    color: '#34D399',
    fontSize: 20,
    fontWeight: '900',
    marginTop: 2,
  },
  textLow: {
    color: '#F87171',
  },
  unitText: {
    fontSize: 14,
    fontWeight: '700',
  },
  thresholdBox: {
    alignItems: 'flex-end',
  },
  thresholdLbl: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  thresholdVal: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '800',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  cardActionGroup: {
    flexDirection: 'row',
    gap: 8,
  },
  usageBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  usageBtnText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  refillBtn: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  refillBtnText: {
    color: '#34D399',
    fontSize: 12,
    fontWeight: '700',
  },
  emptyBanner: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  emptyBannerIcon: {
    fontSize: 36,
    marginBottom: 8,
  },
  emptyBannerTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '800',
  },
  emptyBannerSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 4,
  },
  bannerActionBtn: {
    backgroundColor: '#10B981',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 14,
  },
  bannerActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    maxHeight: '85%',
  },
  modalTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
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
  categoryToggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  catToggleBtn: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  catToggleActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  catToggleText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  catToggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rowTwoInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  unitRow: {
    flexDirection: 'row',
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 2,
    borderWidth: 1,
    borderColor: '#334155',
  },
  unitBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  unitBtnActive: {
    backgroundColor: '#10B981',
  },
  unitBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },
  unitBtnTextActive: {
    color: '#FFFFFF',
  },
  sessionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  sessionBtn: {
    flex: 1,
    backgroundColor: '#0F172A',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  sessionBtnActive: {
    backgroundColor: '#10B981',
    borderColor: '#34D399',
  },
  sessionBtnText: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
  },
  sessionBtnTextActive: {
    color: '#FFFFFF',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
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
