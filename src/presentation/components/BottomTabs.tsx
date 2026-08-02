import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export type TabType = 'production' | 'stock';

interface BottomTabsProps {
  activeTab: TabType;
  onSelectTab: (tab: TabType) => void;
}

export const BottomTabs: React.FC<BottomTabsProps> = ({ activeTab, onSelectTab }) => {
  return (
    <SafeAreaView edges={['bottom']} style={styles.safeArea}>
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'production' && styles.activeTabButton]}
          onPress={() => onSelectTab('production')}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>🐄</Text>
          <Text style={[styles.tabLabel, activeTab === 'production' && styles.activeTabLabel]}>
            Cattle & Production
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'stock' && styles.activeTabButton]}
          onPress={() => onSelectTab('stock')}
          activeOpacity={0.7}
        >
          <Text style={styles.tabIcon}>🌾</Text>
          <Text style={[styles.tabLabel, activeTab === 'stock' && styles.activeTabLabel]}>
            Farm Stock
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: '#0F172A',
  },
  tabBar: {
    flexDirection: 'row',
    height: 64,
    backgroundColor: '#1E293B',
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    borderRadius: 12,
    marginHorizontal: 8,
  },
  activeTabButton: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: '#10B981',
  },
  tabIcon: {
    fontSize: 20,
    marginBottom: 2,
  },
  tabLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  activeTabLabel: {
    color: '#34D399',
  },
});
