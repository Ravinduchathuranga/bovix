import React, { useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  TouchableWithoutFeedback,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';
import { TabType } from './BottomTabs';

const { width } = Dimensions.get('window');
const DRAWER_WIDTH = Math.min(width * 0.78, 320);

interface DrawerMenuProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab?: TabType;
  onSelectTab: (tab: TabType) => void;
  onNavigateToAddCattle?: () => void;
}

export const DrawerMenu: React.FC<DrawerMenuProps> = ({
  isOpen,
  onClose,
  activeTab,
  onSelectTab,
  onNavigateToAddCattle,
}) => {
  const { user, logout } = useAuth();
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, fadeAnim]);

  if (!isOpen) return null;

  const handleNav = (action: () => void) => {
    onClose();
    setTimeout(action, 150);
  };

  return (
    <Modal transparent visible={isOpen} onRequestClose={onClose} animationType="none">
      <View style={styles.overlayContainer}>
        {/* Backdrop overlay */}
        <TouchableWithoutFeedback onPress={onClose}>
          <Animated.View style={[styles.backdrop, { opacity: fadeAnim }]} />
        </TouchableWithoutFeedback>

        {/* Drawer Content */}
        <Animated.View
          style={[
            styles.drawerContent,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <SafeAreaView style={styles.safeArea}>
            {/* Header / Profile section */}
            <View style={styles.profileHeader}>
              <View style={styles.avatarCircle}>
                <Text style={styles.avatarText}>
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'B'}
                </Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName} numberOfLines={1}>
                  {user?.name || 'Farmer'}
                </Text>
                <Text style={styles.farmName} numberOfLines={1}>
                  {user?.farmName || 'Bovix Farm'}
                </Text>
                <Text style={styles.userEmail} numberOfLines={1}>
                  {user?.email || ''}
                </Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Menu Items */}
            <View style={styles.menuList}>
              <Text style={styles.sectionHeader}>NAVIGATION</Text>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  activeTab === 'dashboard' && styles.menuItemActive,
                ]}
                onPress={() => handleNav(() => onSelectTab('dashboard'))}
                activeOpacity={0.7}
              >
                <Feather
                  name="home"
                  size={20}
                  color={activeTab === 'dashboard' ? '#10B981' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.menuText,
                    activeTab === 'dashboard' && styles.menuTextActive,
                  ]}
                >
                  Dashboard
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  activeTab === 'settings' && styles.menuItemActive,
                ]}
                onPress={() => handleNav(() => onSelectTab('settings'))}
                activeOpacity={0.7}
              >
                <Feather
                  name="settings"
                  size={20}
                  color={activeTab === 'settings' ? '#10B981' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.menuText,
                    activeTab === 'settings' && styles.menuTextActive,
                  ]}
                >
                  Settings
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer / Logout */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => handleNav(logout)}
                activeOpacity={0.7}
              >
                <Feather name="log-out" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  drawerContent: {
    width: DRAWER_WIDTH,
    height: '100%',
    backgroundColor: '#1E293B',
    borderRightWidth: 1,
    borderRightColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 16,
  },
  safeArea: {
    flex: 1,
    paddingVertical: 16,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  farmName: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '600',
    marginTop: 2,
  },
  userEmail: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  divider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: 12,
  },
  menuList: {
    flex: 1,
    paddingHorizontal: 12,
    paddingTop: 8,
  },
  sectionHeader: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  menuItemActive: {
    backgroundColor: '#0F172A',
  },
  menuText: {
    color: '#94A3B8',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 14,
  },
  menuTextActive: {
    color: '#10B981',
    fontWeight: '700',
  },
  footer: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 14,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  logoutText: {
    color: '#EF4444',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 12,
  },
});
