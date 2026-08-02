import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  Alert,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { Cattle } from '../../domain/entities/cattle';

interface CattleProfileScreenProps {
  cow: Cattle;
  onBack: () => void;
  onDelete?: (cowId: string, cowName: string, tagNumber: string) => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SLIDER_WIDTH = SCREEN_WIDTH - 40;

export const CattleProfileScreen: React.FC<CattleProfileScreenProps> = ({
  cow,
  onBack,
  onDelete,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Entrance animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

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

  const getHealthBadge = (health: Cattle['healthStatus']) => {
    switch (health) {
      case 'healthy':
        return { label: '💚 Healthy', bg: '#064E3B', color: '#A7F3D0' };
      case 'needs_attention':
        return { label: '⚠️ Needs Attention', bg: '#45300B', color: '#FDE68A' };
      case 'under_treatment':
        return { label: '🚨 Under Treatment', bg: '#451A1A', color: '#FCA5A5' };
      default:
        return { label: health, bg: '#334155', color: '#94A3B8' };
    }
  };

  const statusBadge = getStatusBadge(cow.status);
  const healthBadge = getHealthBadge(cow.healthStatus);

  const photoList = cow.images && cow.images.length > 0
    ? cow.images
    : cow.imageUri
    ? [cow.imageUri]
    : [];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const slide = Math.round(event.nativeEvent.contentOffset.x / SLIDER_WIDTH);
    if (slide !== activeIndex && slide >= 0 && slide < photoList.length) {
      setActiveIndex(slide);
    }
  };

  const handleDeletePress = () => {
    if (onDelete) {
      onDelete(cow.id, cow.name, cow.tagNumber);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View
        style={{
          flex: 1,
          opacity: fadeAnim,
          transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
        }}
      >
        {/* Screen Header */}
        <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Feather name="arrow-left" size={22} color="#10B981" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{cow.name}</Text>
          <Text style={styles.headerSubtitle}>Tag #{cow.tagNumber}</Text>
        </View>
        {onDelete ? (
          <TouchableOpacity style={styles.deleteHeaderBtn} onPress={handleDeletePress} activeOpacity={0.7}>
            <Feather name="trash-2" size={20} color="#EF4444" />
          </TouchableOpacity>
        ) : (
          <View style={{ width: 36 }} />
        )}
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* Photo Gallery / Slider */}
        <View style={styles.heroSection}>
          {photoList.length > 0 ? (
            <View style={styles.sliderContainer}>
              <ScrollView
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={handleScroll}
                scrollEventThrottle={16}
                style={styles.sliderScrollView}
              >
                {photoList.map((uri, index) => (
                  <View key={index} style={styles.slideItem}>
                    <Image source={{ uri }} style={styles.sliderImage} />
                  </View>
                ))}
              </ScrollView>

              {/* Photo Counter */}
              <View style={styles.counterBadge}>
                <Text style={styles.counterText}>
                  📷 {activeIndex + 1} / {photoList.length}
                </Text>
              </View>

              {/* Dots */}
              {photoList.length > 1 && (
                <View style={styles.dotsContainer}>
                  {photoList.map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.dot,
                        i === activeIndex ? styles.activeDot : styles.inactiveDot,
                      ]}
                    />
                  ))}
                </View>
              )}
            </View>
          ) : (
            <View style={styles.cowHeroPlaceholder}>
              <Text style={styles.cowHeroEmoji}>🐄</Text>
            </View>
          )}

          <Text style={styles.cowTitleName}>{cow.name}</Text>
          <Text style={styles.cowSubTag}>Tag #{cow.tagNumber} • {cow.breed}</Text>

          <View style={styles.badgeRow}>
            <View style={[styles.badge, { backgroundColor: statusBadge.bg }]}>
              <Text style={[styles.badgeText, { color: statusBadge.color }]}>
                {statusBadge.label}
              </Text>
            </View>

            <View style={[styles.badge, { backgroundColor: healthBadge.bg }]}>
              <Text style={[styles.badgeText, { color: healthBadge.color }]}>
                {healthBadge.label}
              </Text>
            </View>
          </View>
        </View>

        {/* Metrics Overview Grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🥛</Text>
            <Text style={styles.metricVal}>{cow.dailyMilkYieldLiters} L/day</Text>
            <Text style={styles.metricLbl}>Daily Milk</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🎂</Text>
            <Text style={styles.metricVal}>{cow.ageYears}y {cow.ageMonths}m</Text>
            <Text style={styles.metricLbl}>Age</Text>
          </View>

          <View style={styles.metricCard}>
            <Text style={styles.metricIcon}>🐮</Text>
            <Text style={styles.metricVal}>{cow.calvesDelivered}</Text>
            <Text style={styles.metricLbl}>Calves Born</Text>
          </View>
        </View>

        {/* Profile Details List */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionHeading}>Identifications & Attributes</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Ear Tag Number</Text>
              <Text style={styles.infoValue}>{cow.tagNumber}</Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Gender</Text>
              <Text style={styles.infoValue}>
                {cow.gender === 'female' ? '♀ Female (Cow)' : '♂ Male (Bull)'}
              </Text>
            </View>

            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Breed Classification</Text>
              <Text style={styles.infoValue}>{cow.breed}</Text>
            </View>

            <View style={[styles.infoRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.infoLabel}>Last Milking Session</Text>
              <Text style={styles.infoValue}>{cow.lastMilkingTime || 'Not recorded today'}</Text>
            </View>
          </View>
        </View>

        {/* Medical History Section */}
        <View style={styles.detailSection}>
          <Text style={styles.sectionHeading}>🩺 Medical History & Notes</Text>
          <View style={styles.medicalBox}>
            <Text style={styles.medicalText}>
              {cow.medicalHistory && cow.medicalHistory.trim()
                ? cow.medicalHistory
                : 'No medical conditions or treatment records logged for this cow.'}
            </Text>
          </View>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
      </Animated.View>
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
  backBtn: {
    padding: 6,
  },
  headerTitleContainer: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '800',
  },
  headerSubtitle: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 1,
  },
  deleteHeaderBtn: {
    padding: 6,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 8,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 20,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 220,
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#1E293B',
  },
  sliderScrollView: {
    width: SLIDER_WIDTH,
    height: 220,
  },
  slideItem: {
    width: SLIDER_WIDTH,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderImage: {
    width: SLIDER_WIDTH,
    height: 220,
    resizeMode: 'cover',
  },
  counterBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  counterText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '700',
  },
  dotsContainer: {
    position: 'absolute',
    bottom: 10,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    height: 6,
    borderRadius: 3,
  },
  activeDot: {
    width: 18,
    backgroundColor: '#10B981',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  cowHeroPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#1E293B',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 14,
  },
  cowHeroEmoji: {
    fontSize: 50,
  },
  cowTitleName: {
    fontSize: 26,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cowSubTag: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 3,
    marginBottom: 12,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricIcon: {
    fontSize: 22,
    marginBottom: 6,
  },
  metricVal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metricLbl: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailSection: {
    marginBottom: 20,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 10,
  },
  infoCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 14,
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  medicalBox: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  medicalText: {
    color: '#CBD5E1',
    fontSize: 14,
    lineHeight: 20,
  },
});
