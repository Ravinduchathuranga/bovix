import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';

export const SettingsScreen: React.FC = () => {
  const { user, logout } = useAuth();

  // Settings State
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [milkingReminders, setMilkingReminders] = useState(true);
  const [healthAlerts, setHealthAlerts] = useState(true);
  const [darkMode, setDarkMode] = useState(true);
  const [yieldUnit, setYieldUnit] = useState<'Liters' | 'Gallons'>('Liters');

  const handleClearCache = () => {
    Alert.alert('Cache Cleared', 'Local offline data cache has been refreshed.');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
        <Text style={styles.headerSubtitle}>App Preferences & Account</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Summary Card */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Farm Account</Text>
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.name?.charAt(0) || 'F'}</Text>
            </View>
            <View style={styles.profileDetails}>
              <Text style={styles.profileName}>{user?.name || 'Farmer Name'}</Text>
              <Text style={styles.profileEmail}>{user?.email || 'farmer@bovix.com'}</Text>
              <Text style={styles.profileFarm}>{user?.farmName || 'Bovix Dairy Farm'}</Text>
            </View>
          </View>
        </View>

        {/* Notifications & Reminders */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Notifications & Alerts</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Push Notifications</Text>
              <Text style={styles.settingDesc}>Receive system-wide updates</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#334155', true: '#059669' }}
              thumbColor={notificationsEnabled ? '#10B981' : '#94A3B8'}
            />
          </View>

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Milking Schedule Reminders</Text>
              <Text style={styles.settingDesc}>Alerts for morning & evening milking</Text>
            </View>
            <Switch
              value={milkingReminders}
              onValueChange={setMilkingReminders}
              trackColor={{ false: '#334155', true: '#059669' }}
              thumbColor={milkingReminders ? '#10B981' : '#94A3B8'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Cattle Health Alerts</Text>
              <Text style={styles.settingDesc}>Immediate alerts when cattle status changes</Text>
            </View>
            <Switch
              value={healthAlerts}
              onValueChange={setHealthAlerts}
              trackColor={{ false: '#334155', true: '#059669' }}
              thumbColor={healthAlerts ? '#10B981' : '#94A3B8'}
            />
          </View>
        </View>

        {/* Display & Measurement Preferences */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>Display & Units</Text>

          <View style={styles.settingRow}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Dark Theme</Text>
              <Text style={styles.settingDesc}>Comfortable night time reading</Text>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#334155', true: '#059669' }}
              thumbColor={darkMode ? '#10B981' : '#94A3B8'}
            />
          </View>

          <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
            <View style={styles.settingTextContainer}>
              <Text style={styles.settingTitle}>Milk Yield Unit</Text>
              <Text style={styles.settingDesc}>Select volume unit</Text>
            </View>
            <TouchableOpacity
              style={styles.unitToggleBtn}
              onPress={() => setYieldUnit(yieldUnit === 'Liters' ? 'Gallons' : 'Liters')}
            >
              <Text style={styles.unitToggleText}>{yieldUnit}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* System & Storage */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeader}>System</Text>

          <TouchableOpacity style={styles.actionRow} onPress={handleClearCache}>
            <Text style={styles.actionTitle}>Clear Offline Cache</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>

          <View style={styles.actionRow}>
            <Text style={styles.actionTitle}>App Version</Text>
            <Text style={styles.actionValue}>v1.0.0 (Expo SDK 57)</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={logout} activeOpacity={0.8}>
          <Text style={styles.logoutButtonText}>Log Out</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionCard: {
    backgroundColor: '#1E293B',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    color: '#F8FAFC',
    fontSize: 16,
    fontWeight: '700',
  },
  profileEmail: {
    color: '#94A3B8',
    fontSize: 13,
    marginTop: 2,
  },
  profileFarm: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 2,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  settingTextContainer: {
    flex: 1,
    paddingRight: 12,
  },
  settingTitle: {
    color: '#F8FAFC',
    fontSize: 15,
    fontWeight: '600',
  },
  settingDesc: {
    color: '#94A3B8',
    fontSize: 12,
    marginTop: 2,
  },
  unitToggleBtn: {
    backgroundColor: '#0F172A',
    borderColor: '#10B981',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  unitToggleText: {
    color: '#10B981',
    fontSize: 13,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  actionTitle: {
    color: '#F8FAFC',
    fontSize: 14,
    fontWeight: '600',
  },
  actionArrow: {
    color: '#94A3B8',
    fontSize: 18,
  },
  actionValue: {
    color: '#94A3B8',
    fontSize: 13,
  },
  logoutButton: {
    backgroundColor: '#451A1A',
    borderColor: '#EF4444',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 8,
  },
  logoutButtonText: {
    color: '#FCA5A5',
    fontSize: 16,
    fontWeight: '700',
  },
});
