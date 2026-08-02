import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Animated,
  Easing,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenSettings?: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  onOpenSettings,
}) => {
  const { user, logout } = useAuth();

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      scaleAnim.setValue(0.9);
      fadeAnim.setValue(0);
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.out(Easing.back(1.4)),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 180,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, scaleAnim, fadeAnim]);

  if (!isOpen) return null;

  const handleSettings = () => {
    onClose();
    if (onOpenSettings) {
      setTimeout(onOpenSettings, 150);
    }
  };

  const handleLogout = () => {
    onClose();
    setTimeout(logout, 150);
  };

  return (
    <Modal transparent visible={isOpen} onRequestClose={onClose} animationType="fade">
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.modalCard,
                {
                  opacity: fadeAnim,
                  transform: [{ scale: scaleAnim }],
                },
              ]}
            >
              {/* Top Header Row with Close Button */}
              <View style={styles.modalHeader}>
                <Text style={styles.headerTitle}>Account Profile</Text>
                <TouchableOpacity
                  onPress={onClose}
                  style={styles.closeBtn}
                  activeOpacity={0.7}
                >
                  <Feather name="x" size={20} color="#94A3B8" />
                </TouchableOpacity>
              </View>

              {/* Profile Details Card */}
              <View style={styles.profileSection}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarText}>
                    {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
                  </Text>
                </View>
                <Text style={styles.userName}>{user?.name || 'Farmer Name'}</Text>
                <Text style={styles.userEmail}>{user?.email || 'farmer@bovix.com'}</Text>

                <View style={styles.farmPill}>
                  <Feather name="home" size={13} color="#10B981" style={{ marginRight: 6 }} />
                  <Text style={styles.farmName}>{user?.farmName || 'Bovix Dairy Farm'}</Text>
                </View>
              </View>

              <View style={styles.divider} />

              {/* Quick Actions */}
              <TouchableOpacity
                style={styles.actionRow}
                onPress={handleSettings}
                activeOpacity={0.75}
              >
                <View style={styles.actionIconBg}>
                  <Feather name="settings" size={18} color="#10B981" />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.actionTitle}>Manage Settings</Text>
                  <Text style={styles.actionDesc}>Preferences & app configuration</Text>
                </View>
                <Feather name="chevron-right" size={18} color="#64748B" />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionRow, styles.logoutRow]}
                onPress={handleLogout}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIconBg, styles.logoutIconBg]}>
                  <Feather name="log-out" size={18} color="#EF4444" />
                </View>
                <View style={styles.actionTextContainer}>
                  <Text style={styles.logoutTitle}>Sign Out</Text>
                  <Text style={styles.actionDesc}>Log out of Bovix account</Text>
                </View>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    backgroundColor: '#1E293B',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  closeBtn: {
    padding: 4,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '800',
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 18,
    fontWeight: '700',
  },
  userEmail: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  farmPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 16,
    marginTop: 10,
  },
  farmName: {
    color: '#10B981',
    fontSize: 12,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 16,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  actionIconBg: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  actionTextContainer: {
    flex: 1,
  },
  actionTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  actionDesc: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 1,
  },
  logoutRow: {
    marginTop: 6,
  },
  logoutIconBg: {
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
  },
  logoutTitle: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
  },
});
