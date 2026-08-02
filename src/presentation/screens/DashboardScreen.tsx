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
import { useAuth } from '../context/AuthContext';
import { getDashboardDataUseCase, deleteCattleUseCase } from '../../di/container';
import { Cattle, DashboardMetrics } from '../../domain/entities/cattle';
import { CattleProfileScreen } from './CattleProfileScreen';
import { UserProfileModal } from '../components/UserProfileModal';
import { TabType } from '../components/BottomTabs';

interface FarmServiceShortcut {
  id: string;
  title: string;
  category: string;
  icon: string;
  keywords: string[];
  action: () => void;
}

interface DashboardScreenProps {
  onNavigateToAddCattle?: () => void;
  onNavigateToSettings?: () => void;
  onSelectTab?: (tab: TabType) => void;
  onOpenDrawer?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onNavigateToAddCattle,
  onNavigateToSettings,
  onSelectTab,
  onOpenDrawer,
}) => {
  const { user, logout } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [recentCattle, setRecentCattle] = useState<Cattle[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCow, setSelectedCow] = useState<Cattle | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  const servicesList: FarmServiceShortcut[] = [
    {
      id: 'add-cattle',
      title: 'Register New Cattle',
      category: 'Cattle Management',
      icon: '🐄',
      keywords: ['add', 'cow', 'cattle', 'register', 'create', 'new', 'livestock', 'bull', 'heifer'],
      action: () => onNavigateToAddCattle?.(),
    },
    {
      id: 'daily-milking',
      title: 'Daily Milking Records',
      category: 'Production Logs',
      icon: '🥛',
      keywords: ['milk', 'milking', 'yield', 'liters', 'log', 'daily', 'production', 'record'],
      action: () => onSelectTab?.('milking'),
    },
    {
      id: 'app-settings',
      title: 'Farm & App Settings',
      category: 'Preferences',
      icon: '⚙️',
      keywords: ['setting', 'settings', 'preference', 'unit', 'dark', 'theme', 'account', 'config'],
      action: () => onNavigateToSettings?.(),
    },
    {
      id: 'attention-cattle',
      title: 'Sick & Attention Cattle',
      category: 'Health Alert',
      icon: '🩺',
      keywords: ['health', 'sick', 'attention', 'alert', 'medical', 'vet', 'doctor', 'disease'],
      action: () => setSearchQuery('sick'),
    },
    {
      id: 'lactating-cattle',
      title: 'Active Lactating Cows',
      category: 'Yield Group',
      icon: '⚡',
      keywords: ['lactating', 'lactation', 'active', 'milking cows'],
      action: () => setSearchQuery('lactating'),
    },
    {
      id: 'log-out',
      title: 'Sign Out / Logout',
      category: 'Account Action',
      icon: '🚪',
      keywords: ['logout', 'sign out', 'exit', 'log out'],
      action: () => logout(),
    },
  ];

  const matchingServices = servicesList.filter((svc) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return (
      svc.title.toLowerCase().includes(q) ||
      svc.category.toLowerCase().includes(q) ||
      svc.keywords.some((kw) => kw.includes(q))
    );
  });

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

  const filteredCattle = recentCattle.filter((cow) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      cow.name.toLowerCase().includes(q) ||
      cow.tagNumber.toLowerCase().includes(q) ||
      cow.breed.toLowerCase().includes(q) ||
      cow.status.toLowerCase().includes(q)
    );
  });

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

  const handleDeleteCattle = (cowId: string, cowName: string) => {
    Alert.alert(
      'Delete Cattle Record',
      `Are you sure you want to permanently delete "${cowName}" from your farm records? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setSelectedCow(null);
              await deleteCattleUseCase.execute(cowId);
              loadData();
              Alert.alert('Deleted', `${cowName} has been removed from your farm.`);
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
        onDelete={(id, name) => {
          setSelectedCow(null);
          handleDeleteCattle(id, name);
        }}
      />
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Gmail-Style Floating Search Header */}
        <View style={styles.searchHeaderWrapper}>
          <View style={styles.searchHeaderBar}>
          <TouchableOpacity
            onPress={onOpenDrawer}
            activeOpacity={0.7}
            style={styles.menuIconBtn}
          >
            <Feather name="menu" size={22} color="#CBD5E1" />
          </TouchableOpacity>

          <View
            style={[
              styles.searchInputContainer,
              isSearchFocused && styles.searchInputContainerFocused,
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
              placeholder={`Search "${user?.farmName || 'Bovix Farm'}" cattle...`}
              placeholderTextColor="#64748B"
              value={searchQuery}
              onChangeText={setSearchQuery}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setIsSearchFocused(false)}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                style={styles.clearSearchBtn}
              >
                <Feather name="x" size={16} color="#94A3B8" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            onPress={() => setShowProfileModal(true)}
            activeOpacity={0.8}
            style={styles.profileAvatarBtn}
          >
            <Text style={styles.profileAvatarText}>
              {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
            </Text>
          </TouchableOpacity>
        </View>
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

          {/* Matching Services Section */}
          {searchQuery.trim().length > 0 && matchingServices.length > 0 && (
            <View style={styles.servicesSection}>
              <Text style={styles.servicesSectionHeader}>
                Services & Features ({matchingServices.length})
              </Text>
              {matchingServices.map((svc) => (
                <TouchableOpacity
                  key={svc.id}
                  style={styles.serviceResultCard}
                  onPress={svc.action}
                  activeOpacity={0.8}
                >
                  <Text style={styles.serviceIcon}>{svc.icon}</Text>
                  <View style={styles.serviceTextContainer}>
                    <Text style={styles.serviceTitle}>{svc.title}</Text>
                    <Text style={styles.serviceCategory}>{svc.category}</Text>
                  </View>
                  <Feather name="arrow-up-right" size={18} color="#10B981" />
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Action Bar */}
          <View style={styles.actionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery.trim() ? 'Matching Cattle Records' : 'Recent Cattle'}
            </Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={onNavigateToAddCattle}
              activeOpacity={0.8}
            >
              <Text style={styles.addBtnText}>+ Add Cow</Text>
            </TouchableOpacity>
          </View>

          {/* Empty State Banner or Cattle List */}
          {recentCattle.length === 0 ? (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>🐄</Text>
              <Text style={styles.emptyBannerTitle}>No Cattle Records Found</Text>
              <Text style={styles.emptyBannerSubtitle}>
                Get started by registering your first cow to track milk yield and health metrics.
              </Text>
              <TouchableOpacity
                style={styles.bannerActionBtn}
                onPress={onNavigateToAddCattle}
                activeOpacity={0.8}
              >
                <Text style={styles.bannerActionBtnText}>+ Add New Cattle</Text>
              </TouchableOpacity>
            </View>
          ) : filteredCattle.length === 0 ? (
            <View style={styles.emptyBanner}>
              <Text style={styles.emptyBannerIcon}>🔍</Text>
              <Text style={styles.emptyBannerTitle}>No Matching Cattle</Text>
              <Text style={styles.emptyBannerSubtitle}>
                No cattle records match "{searchQuery}". Try searching by tag number, name, or breed.
              </Text>
            </View>
          ) : (
            filteredCattle.map((cow) => {
              const badge = getStatusBadge(cow.status);
              return (
                <TouchableOpacity
                  key={cow.id}
                  style={styles.cattleCard}
                  onPress={() => setSelectedCow(cow)}
                  activeOpacity={0.85}
                >
                  <View style={styles.cattleCardHeader}>
                    <View style={styles.cattleInfo}>
                      {cow.imageUri ? (
                        <Image source={{ uri: cow.imageUri }} style={styles.cowThumb} />
                      ) : (
                        <View style={styles.cowThumbPlaceholder}>
                          <Text style={styles.cowThumbText}>🐄</Text>
                        </View>
                      )}
                      <View style={styles.cattleTextInfo}>
                        <Text style={styles.cattleName}>{cow.name}</Text>
                        <Text style={styles.cattleTag}>
                          Tag: {cow.tagNumber} • {cow.breed}
                        </Text>
                        <Text style={styles.cattleAge}>
                          Age: {cow.ageYears}y {cow.ageMonths}m • Calves: {cow.calvesDelivered}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                      <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                    </View>
                  </View>

                  <View style={styles.cattleCardFooter}>
                    <Text style={styles.yieldText}>
                      Yield: <Text style={styles.yieldVal}>{cow.dailyMilkYieldLiters} L/day</Text>
                    </Text>
                    <Text style={styles.tapToViewText}>
                      Tap to view details 🔍
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        onOpenSettings={onNavigateToSettings}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  searchHeaderWrapper: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  searchHeaderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuIconBtn: {
    padding: 6,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 24,
    paddingHorizontal: 12,
    borderWidth: 1.5,
    borderColor: '#334155',
    marginHorizontal: 8,
  },
  searchInputContainerFocused: {
    borderColor: '#10B981',
    backgroundColor: '#0F172A',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#F8FAFC',
    fontSize: 14,
    paddingVertical: 6,
    height: 38,
  },
  clearSearchBtn: {
    padding: 6,
  },
  profileAvatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  profileAvatarText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  servicesSection: {
    marginBottom: 20,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#334155',
  },
  servicesSectionHeader: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  serviceResultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  serviceIcon: {
    fontSize: 22,
    marginRight: 12,
  },
  serviceTextContainer: {
    flex: 1,
  },
  serviceTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#F8FAFC',
  },
  serviceCategory: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
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
  cattleInfo: {
    flexDirection: 'row',
    flex: 1,
  },
  cowThumb: {
    width: 44,
    height: 44,
    borderRadius: 10,
    marginRight: 10,
  },
  cowThumbPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cowThumbText: {
    fontSize: 20,
  },
  cattleTextInfo: {
    flex: 1,
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
  cattleAge: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginLeft: 8,
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
  tapToViewText: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '600',
  },
});
