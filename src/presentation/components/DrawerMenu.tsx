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
  Easing,
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

  // Animation values
  const slideAnim = useRef(new Animated.Value(-DRAWER_WIDTH)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Staggered content animations
  const headerAnim = useRef(new Animated.Value(0)).current;
  const itemsAnim = useRef(new Animated.Value(0)).current;
  const footerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isOpen) {
      // Reset stagger values
      headerAnim.setValue(0);
      itemsAnim.setValue(0);
      footerAnim.setValue(0);

      // 1. Spring slide the drawer in
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 70,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Stagger slide-in interior elements
      Animated.stagger(60, [
        Animated.timing(headerAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(itemsAnim, {
          toValue: 1,
          duration: 240,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(footerAnim, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Smooth exit
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 220,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isOpen, slideAnim, fadeAnim, headerAnim, itemsAnim, footerAnim]);

  if (!isOpen) return null;

  const handleNav = (action: () => void) => {
    onClose();
    setTimeout(action, 150);
  };

  // Interpolated slide transforms for staggered elements
  const headerTranslateX = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-24, 0],
  });

  const itemsTranslateX = itemsAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-30, 0],
  });

  const footerTranslateX = footerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-20, 0],
  });

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
            {/* Header / Profile section (Staggered) */}
            <Animated.View
              style={[
                styles.profileHeader,
                {
                  opacity: headerAnim,
                  transform: [{ translateX: headerTranslateX }],
                },
              ]}
            >
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
            </Animated.View>

            <View style={styles.divider} />

            {/* Menu Items (Staggered) */}
            <Animated.View
              style={[
                styles.menuList,
                {
                  opacity: itemsAnim,
                  transform: [{ translateX: itemsTranslateX }],
                },
              ]}
            >
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
                  activeTab === 'cattle' && styles.menuItemActive,
                ]}
                onPress={() => handleNav(() => onSelectTab('cattle'))}
                activeOpacity={0.7}
              >
                <Feather
                  name="grid"
                  size={20}
                  color={activeTab === 'cattle' ? '#10B981' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.menuText,
                    activeTab === 'cattle' && styles.menuTextActive,
                  ]}
                >
                  Cattle Management
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.menuItem,
                  activeTab === 'milking' && styles.menuItemActive,
                ]}
                onPress={() => handleNav(() => onSelectTab('milking'))}
                activeOpacity={0.7}
              >
                <Feather
                  name="file-text"
                  size={20}
                  color={activeTab === 'milking' ? '#10B981' : '#94A3B8'}
                />
                <Text
                  style={[
                    styles.menuText,
                    activeTab === 'milking' && styles.menuTextActive,
                  ]}
                >
                  Daily Production
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
            </Animated.View>

            {/* Footer / Logout (Staggered) */}
            <Animated.View
              style={[
                styles.footer,
                {
                  opacity: footerAnim,
                  transform: [{ translateX: footerTranslateX }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.logoutBtn}
                onPress={() => handleNav(logout)}
                activeOpacity={0.7}
              >
                <Feather name="log-out" size={20} color="#EF4444" />
                <Text style={styles.logoutText}>Log Out</Text>
              </TouchableOpacity>
            </Animated.View>
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
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
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
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
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
  addCattleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    marginTop: 16,
    gap: 8,
  },
  addCattleBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
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
