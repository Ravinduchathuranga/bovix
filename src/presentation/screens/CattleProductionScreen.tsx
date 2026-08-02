import React from 'react';
import { StyleSheet, View } from 'react-native';
import { DashboardScreen } from './DashboardScreen';
import { CattleScreen } from './CattleScreen';
import { DailyMilkingScreen } from './DailyMilkingScreen';
import { TabType } from '../components/BottomTabs';

export type ProductionSubTab = 'dashboard' | 'cattle' | 'milking';

interface CattleProductionScreenProps {
  subSegment: ProductionSubTab;
  onNavigateToAddCattle: () => void;
  onNavigateToSettings?: () => void;
  onSelectTab?: (tab: TabType) => void;
  onOpenDrawer?: () => void;
}

export const CattleProductionScreen: React.FC<CattleProductionScreenProps> = ({
  subSegment,
  onNavigateToAddCattle,
  onNavigateToSettings,
  onSelectTab,
  onOpenDrawer,
}) => {
  return (
    <View style={styles.container}>
      {subSegment === 'dashboard' && (
        <DashboardScreen
          onNavigateToAddCattle={onNavigateToAddCattle}
          onNavigateToSettings={onNavigateToSettings}
          onSelectTab={onSelectTab}
          onOpenDrawer={onOpenDrawer}
        />
      )}
      {subSegment === 'cattle' && (
        <CattleScreen
          onNavigateToAddCattle={onNavigateToAddCattle}
          onOpenDrawer={onOpenDrawer}
        />
      )}
      {subSegment === 'milking' && (
        <DailyMilkingScreen onOpenDrawer={onOpenDrawer} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});
