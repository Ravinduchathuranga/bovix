import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Cattle } from '../../domain/entities/cattle';

interface CattleDetailsModalProps {
  visible: boolean;
  cow: Cattle | null;
  onClose: () => void;
}

const SLIDER_WIDTH = 290;

export const CattleDetailsModal: React.FC<CattleDetailsModalProps> = ({
  visible,
  cow,
  onClose,
}) => {
  const [activeIndex, setActiveIndex] = useState(0);

  if (!cow) return null;

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

  // Compile photos list
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

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header Bar */}
          <View style={styles.headerBar}>
            <Text style={styles.headerTitle}>Cattle Profile</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scrollBody}>
            {/* Image Slider / Hero Gallery */}
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

                  {/* Counter Badge */}
                  <View style={styles.counterBadge}>
                    <Text style={styles.counterText}>
                      📷 {activeIndex + 1} / {photoList.length}
                    </Text>
                  </View>

                  {/* Paging Dots */}
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

              <Text style={styles.cowName}>{cow.name}</Text>
              <Text style={styles.cowTag}>Tag #{cow.tagNumber} • {cow.breed}</Text>

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
                <Text style={styles.metricVal}>{cow.dailyMilkYieldLiters} L</Text>
                <Text style={styles.metricLbl}>Daily Yield</Text>
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
              <Text style={styles.sectionHeading}>Detailed Profile</Text>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Ear Tag ID</Text>
                <Text style={styles.infoValue}>{cow.tagNumber}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Gender</Text>
                <Text style={styles.infoValue}>
                  {cow.gender === 'female' ? '♀ Female (Cow)' : '♂ Male (Bull)'}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Breed Type</Text>
                <Text style={styles.infoValue}>{cow.breed}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Last Milking Session</Text>
                <Text style={styles.infoValue}>{cow.lastMilkingTime || 'Not recorded today'}</Text>
              </View>
            </View>

            {/* Medical History Section */}
            <View style={styles.detailSection}>
              <Text style={styles.sectionHeading}>🩺 Medical History & Notes</Text>
              <View style={styles.medicalBox}>
                <Text style={styles.medicalText}>
                  {cow.medicalHistory && cow.medicalHistory.trim()
                    ? cow.medicalHistory
                    : 'No prior medical conditions or treatment notes logged for this cattle.'}
                </Text>
              </View>
            </View>
          </ScrollView>

          {/* Action Footer */}
          <View style={styles.footerAction}>
            <TouchableOpacity style={styles.doneBtn} onPress={onClose} activeOpacity={0.8}>
              <Text style={styles.doneBtnText}>Close Details</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  modalContent: {
    backgroundColor: '#1E293B',
    borderRadius: 20,
    width: '100%',
    maxHeight: '92%',
    borderWidth: 1,
    borderColor: '#334155',
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
  },
  closeBtnText: {
    color: '#94A3B8',
    fontSize: 18,
    fontWeight: '700',
  },
  scrollBody: {
    paddingHorizontal: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 16,
  },
  sliderContainer: {
    width: SLIDER_WIDTH,
    height: 190,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#0F172A',
  },
  sliderScrollView: {
    width: SLIDER_WIDTH,
    height: 190,
  },
  slideItem: {
    width: SLIDER_WIDTH,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sliderImage: {
    width: SLIDER_WIDTH,
    height: 190,
    resizeMode: 'cover',
  },
  counterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    paddingHorizontal: 8,
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
    bottom: 8,
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
    width: 16,
    backgroundColor: '#10B981',
  },
  inactiveDot: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  cowHeroPlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#334155',
    marginBottom: 12,
  },
  cowHeroEmoji: {
    fontSize: 44,
  },
  cowName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  cowTag: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 2,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#334155',
  },
  metricIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  metricVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#F8FAFC',
  },
  metricLbl: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  detailSection: {
    marginBottom: 18,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    color: '#F8FAFC',
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#0F172A',
  },
  infoLabel: {
    color: '#94A3B8',
    fontSize: 13,
  },
  infoValue: {
    color: '#F8FAFC',
    fontSize: 13,
    fontWeight: '600',
  },
  medicalBox: {
    backgroundColor: '#0F172A',
    borderRadius: 10,
    padding: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  medicalText: {
    color: '#CBD5E1',
    fontSize: 13,
    lineHeight: 18,
  },
  footerAction: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  doneBtn: {
    backgroundColor: '#10B981',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  doneBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
