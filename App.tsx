import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/presentation/context/AuthContext';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { CattleProductionScreen, ProductionSubTab } from './src/presentation/screens/CattleProductionScreen';
import { StockManagementScreen } from './src/presentation/screens/StockManagementScreen';
import { AddCattleScreen } from './src/presentation/screens/AddCattleScreen';
import { SettingsScreen } from './src/presentation/screens/SettingsScreen';
import { BottomTabs, TabType } from './src/presentation/components/BottomTabs';
import { DrawerMenu } from './src/presentation/components/DrawerMenu';
import { ScreenTransition } from './src/presentation/components/ScreenTransition';

const RootNavigation: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('production');
  const [productionSubTab, setProductionSubTab] = useState<ProductionSubTab>('dashboard');
  const [showAddCattle, setShowAddCattle] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  if (!user) {
    return <LoginScreen />;
  }

  // Full Screen View: Add Cattle Form
  if (showAddCattle) {
    return (
      <ScreenTransition screenKey="add-cattle">
        <AddCattleScreen
          onCattleAdded={() => {
            setShowAddCattle(false);
            setCurrentTab('production');
            setProductionSubTab('cattle');
          }}
          onCancel={() => setShowAddCattle(false)}
        />
      </ScreenTransition>
    );
  }

  // Full Screen View: Settings Page
  if (showSettings) {
    return (
      <ScreenTransition screenKey="settings">
        <SettingsScreen onBack={() => setShowSettings(false)} />
      </ScreenTransition>
    );
  }

  const renderScreen = () => {
    switch (currentTab) {
      case 'production':
        return (
          <CattleProductionScreen
            subSegment={productionSubTab}
            onNavigateToAddCattle={() => setShowAddCattle(true)}
            onNavigateToSettings={() => setShowSettings(true)}
            onSelectTab={setCurrentTab}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        );
      case 'stock':
        return <StockManagementScreen />;
      default:
        return (
          <CattleProductionScreen
            subSegment={productionSubTab}
            onNavigateToAddCattle={() => setShowAddCattle(true)}
            onNavigateToSettings={() => setShowSettings(true)}
            onSelectTab={setCurrentTab}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>
        <ScreenTransition screenKey={`${currentTab}-${productionSubTab}`}>
          {renderScreen()}
        </ScreenTransition>
      </View>
      <BottomTabs activeTab={currentTab} onSelectTab={setCurrentTab} />
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={currentTab}
        subSegment={productionSubTab}
        onSelectTab={setCurrentTab}
        onSelectSubSegment={(sub) => setProductionSubTab(sub)}
        onNavigateToSettings={() => setShowSettings(true)}
      />
    </View>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <View style={styles.container}>
          <StatusBar style="light" />
          <RootNavigation />
        </View>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  screenContainer: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
