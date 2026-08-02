import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type TabType = 'dashboard' | 'milking' | 'settings';

interface BottomTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({ activeTab, onSelectTab }) => {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'dashboard' && styles.activeTabButton]}
          onPress={() => onSelectTab('dashboard')}
          activeOpacity={0.7}
        >
          <Feather name="home" size={24} color="white" />
          <Text style={[styles.tabLabel, activeTab === 'dashboard' && styles.activeTabLabel]}>
            Dashboard
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'milking' && styles.activeTabButton]}
          onPress={() => onSelectTab('milking')}
          activeOpacity={0.7}
        >
          <Feather name="file-text" size={24} color="white" />
          <Text style={[styles.tabLabel, activeTab === 'milking' && styles.activeTabLabel]}>
            Daily Logs
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  tabBar: {
    flexDirection: 'row',
    height: 60,
    backgroundColor: '#1E293B',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  activeTabButton: {
    borderTopWidth: 2,
    borderTopColor: '#10B981',
  },
  tabIcon: {
    fontSize: 18,
  },
  tabLabel: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
    marginTop: 2,
  },
  activeTabLabel: {
    color: '#10B981',
    fontWeight: '700',
  },
});
