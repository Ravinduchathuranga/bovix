import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  Alert,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, FontAwesome } from '@expo/vector-icons';
import { getAllCattleUseCase, deleteCattleUseCase } from '../../di/container';
import { Cattle } from '../../domain/entities/cattle';
import { CattleProfileScreen } from './CattleProfileScreen';

interface CattleScreenProps {
  onNavigateToAddCattle: () => void;
  onOpenDrawer?: () => void;
  onBack?: () => void;
}

type StatusFilter = 'all' | 'lactating' | 'dry' | 'pregnant' | 'calf' | 'sick';

export const CattleScreen: React.FC<CattleScreenProps> = ({
  onNavigateToAddCattle,
  onOpenDrawer,
  onBack,
}) => {
  const [cattleList, setCattleList] = useState<Cattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCow, setSelectedCow] = useState<Cattle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<StatusFilter>('all');
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const fetchCattle = async () => {
    setLoading(true);
    try {
      const data = await getAllCattleUseCase.execute();
      setCattleList(data);
    } catch (err) {
      console.error('Failed to load cattle list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCattle();
  }, []);

  const handleDeleteCattle = (id: string, name: string, tagNumber: string) => {
    Alert.alert(
      'Delete Cattle Record',
      `Are you sure you want to delete ${name} (${tagNumber})? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCattleUseCase.execute(id);
              fetchCattle();
              Alert.alert('Deleted', `${name} has been removed from herd.`);
            } catch (err: any) {
              Alert.alert('Error', err.message || 'Failed to delete cattle.');
            }
          },
        },
      ]
    );
  };

  if (selectedCow) {
    return (
      <CattleProfileScreen
        cow={selectedCow}
        onBack={() => setSelectedCow(null)}
        onDelete={(id, name, tag) => {
          setSelectedCow(null);
          handleDeleteCattle(id, name, tag);
        }}
      />
    );
  }

  // Filter cattle by search query and category pill
  const filteredCattle = cattleList.filter((cow) => {
    const matchesSearch =
      cow.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cow.tagNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cow.breed.toLowerCase().includes(searchQuery.toLowerCase()) ||
      cow.status.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedStatusFilter === 'all') return true;
    if (selectedStatusFilter === 'sick') {
      return cow.healthStatus === 'needs_attention' || cow.healthStatus === 'under_treatment';
    }
    return cow.status === selectedStatusFilter;
  });

  // Summary Metrics
  const totalCount = cattleList.length;
  const lactatingCount = cattleList.filter((c) => c.status === 'lactating').length;
  const sickCount = cattleList.filter(
    (c) => c.healthStatus === 'needs_attention' || c.healthStatus === 'under_treatment'
  ).length;

  const filterOptions: { id: StatusFilter; label: string; icon: string; count?: number }[] = [
    { id: 'all', label: 'All Herd', icon: '🐄', count: totalCount },
    { id: 'lactating', label: 'Lactating', icon: '🥛', count: lactatingCount },
    { id: 'dry', label: 'Dry', icon: '🌾' },
    { id: 'pregnant', label: 'Pregnant', icon: '🤰' },
    { id: 'calf', label: 'Calves', icon: '🐮' },
    { id: 'sick', label: 'Sick / Alert', icon: '🩺', count: sickCount },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Screen Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            {onBack ? (
              <TouchableOpacity onPress={onBack} style={styles.backButton} activeOpacity={0.7}>
                <Feather name="arrow-left" size={22} color="#10B981" />
              </TouchableOpacity>
            ) : onOpenDrawer ? (
              <TouchableOpacity onPress={onOpenDrawer} style={styles.menuIconBtn} activeOpacity={0.7}>
                <Feather name="menu" size={22} color="#CBD5E1" />
              </TouchableOpacity>
            ) : null}
            <View>
              <Text style={styles.headerTitle}>Cattle Management</Text>
              <Text style={styles.headerSubtitle}>
                {totalCount} Total Livestock • {lactatingCount} Lactating
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.addCattleHeaderBtn}
            onPress={onNavigateToAddCattle}
            activeOpacity={0.8}
          >
            <Text style={styles.addCattleHeaderBtnText}>+ Register</Text>
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <View
            style={[
              styles.searchBar,
              isSearchFocused && styles.searchBarFocused,
            ]}
          >
            <Feather
              name="search"
              size={18}
              color={isSearchFocused ? '#10B981' : '#94A3B8'}
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Search Tag, Cow Name, Breed, or Status..."
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearSearchBtn}>
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterPillsWrapper}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterPillsScroll}>
            {filterOptions.map((opt) => {
              const isActive = selectedStatusFilter === opt.id;
              return (
                <TouchableOpacity
                  key={opt.id}
                  style={[styles.filterPill, isActive && styles.filterPillActive]}
                  onPress={() => setSelectedStatusFilter(opt.id)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.filterPillIcon}>{opt.icon}</Text>
                  <Text style={[styles.filterPillLabel, isActive && styles.filterPillLabelActive]}>
                    {opt.label}
                  </Text>
                  {opt.count !== undefined && opt.count > 0 ? (
                    <View style={[styles.filterCountBadge, isActive && styles.filterCountBadgeActive]}>
                      <Text style={[styles.filterCountText, isActive && styles.filterCountTextActive]}>
                        {opt.count}
                      </Text>
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Content Body */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading Cattle Records...</Text>
          </View>
        ) : (
          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {filteredCattle.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>🐄</Text>
                <Text style={styles.emptyTitle}>
                  {searchQuery ? `No cattle matching "${searchQuery}"` : 'No Cattle Registered'}
                </Text>
                <Text style={styles.emptySubtitle}>
                  {searchQuery
                    ? 'Try adjusting your search terms or filter category.'
                    : 'Get started by registering your first dairy cow.'}
                </Text>
                <TouchableOpacity
                  style={styles.emptyAddBtn}
                  onPress={onNavigateToAddCattle}
                  activeOpacity={0.8}
                >
                  <Text style={styles.emptyAddBtnText}>+ Register New Cattle</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.cattleGrid}>
                {filteredCattle.map((cow) => (
                  <View key={cow.id} style={styles.cowCard}>
                    <TouchableOpacity
                      onPress={() => setSelectedCow(cow)}
                      activeOpacity={0.8}
                      style={styles.cowCardContent}
                    >
                      {/* Photo / Avatar */}
                      {cow.imageUri || (cow.images && cow.images[0]) ? (
                        <Image
                          source={{ uri: cow.imageUri || cow.images![0] }}
                          style={styles.cowImage}
                        />
                      ) : (
                        <View style={styles.cowAvatarPlaceholder}>
                          <Text style={styles.cowAvatarText}>🐄</Text>
                        </View>
                      )}

                      <View style={styles.cowInfo}>
                        <View style={styles.cowTagRow}>
                          <View style={styles.tagBadge}>
                            <Text style={styles.tagText}>{cow.tagNumber}</Text>
                          </View>
                          <View
                            style={[
                              styles.statusPill,
                              cow.status === 'lactating'
                                ? styles.statusLactating
                                : cow.status === 'sick'
                                ? styles.statusSick
                                : styles.statusDefault,
                            ]}
                          >
                            <Text style={styles.statusPillText}>{cow.status.toUpperCase()}</Text>
                          </View>
                        </View>

                        <Text style={styles.cowName}>{cow.name}</Text>
                        <Text style={styles.cowBreed}>{cow.breed} • {cow.gender === 'female' ? '♀' : '♂'}</Text>

                        {/* Metrics Row */}
                        <View style={styles.cowMetricsRow}>
                          <View style={styles.cowMetricItem}>
                            <Text style={styles.cowMetricLbl}>Daily Milk</Text>
                            <Text style={styles.cowMetricVal}>{cow.dailyMilkYieldLiters} L/day</Text>
                          </View>
                          <View style={styles.cowMetricItem}>
                            <Text style={styles.cowMetricLbl}>Age</Text>
                            <Text style={styles.cowMetricVal}>
                              {cow.ageYears ? `${cow.ageYears}y` : ''} {cow.ageMonths ? `${cow.ageMonths}m` : ''}
                            </Text>
                          </View>
                        </View>

                        {/* Health Alert Badge */}
                        {cow.healthStatus !== 'healthy' ? (
                          <View style={styles.healthAlertBadge}>
                            <Text style={styles.healthAlertText}>
                              ⚠️ {cow.healthStatus === 'needs_attention' ? 'Needs Attention' : 'Under Treatment'}
                            </Text>
                          </View>
                        ) : null}
                      </View>
                    </TouchableOpacity>

                    {/* Quick Delete */}
                    <TouchableOpacity
                      style={styles.cardDeleteBtn}
                      onPress={() => handleDeleteCattle(cow.id, cow.name, cow.tagNumber)}
                      activeOpacity={0.7}
                    >
                      <Feather name="trash-2" size={16} color="#EF4444" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}

          </ScrollView>
        )}
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 14,
    padding: 6,
  },
  menuIconBtn: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  addCattleHeaderBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  addCattleHeaderBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 44,
    borderWidth: 1,
    borderColor: '#334155',
  },
  searchBarFocused: {
    borderColor: '#10B981',
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 14,
  },
  clearSearchBtn: {
    padding: 4,
  },
  filterPillsWrapper: {
    paddingBottom: 10,
  },
  filterPillsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  filterPillActive: {
    backgroundColor: '#064E3B',
    borderColor: '#10B981',
  },
  filterPillIcon: {
    fontSize: 13,
    marginRight: 6,
  },
  filterPillLabel: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
  },
  filterPillLabelActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  filterCountBadge: {
    backgroundColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginLeft: 6,
  },
  filterCountBadgeActive: {
    backgroundColor: '#10B981',
  },
  filterCountText: {
    color: '#CBD5E1',
    fontSize: 10,
    fontWeight: '700',
  },
  filterCountTextActive: {
    color: '#FFFFFF',
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
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyTitle: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: '#94A3B8',
    fontSize: 13,
    textAlign: 'center',
    marginTop: 6,
    maxWidth: 260,
  },
  emptyAddBtn: {
    marginTop: 20,
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  cattleGrid: {
    gap: 14,
    paddingTop: 8,
  },
  cowCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
    position: 'relative',
  },
  cowCardContent: {
    flexDirection: 'row',
    padding: 14,
  },
  cowImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#0F172A',
  },
  cowAvatarPlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cowAvatarText: {
    fontSize: 36,
  },
  cowInfo: {
    flex: 1,
    marginLeft: 14,
  },
  cowTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  tagBadge: {
    backgroundColor: '#064E3B',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  tagText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusLactating: {
    backgroundColor: '#0284C7',
  },
  statusSick: {
    backgroundColor: '#991B1B',
  },
  statusDefault: {
    backgroundColor: '#334155',
  },
  statusPillText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  cowName: {
    color: '#F8FAFC',
    fontSize: 17,
    fontWeight: '800',
  },
  cowBreed: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  cowMetricsRow: {
    flexDirection: 'row',
    gap: 16,
    marginTop: 10,
  },
  cowMetricItem: {
    flexDirection: 'column',
  },
  cowMetricLbl: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },
  cowMetricVal: {
    color: '#CBD5E1',
    fontSize: 13,
    fontWeight: '700',
  },
  healthAlertBadge: {
    marginTop: 8,
    backgroundColor: '#451A1A',
    borderColor: '#EF4444',
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  healthAlertText: {
    color: '#FCA5A5',
    fontSize: 11,
    fontWeight: '700',
  },
  cardDeleteBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 6,
  },
});
