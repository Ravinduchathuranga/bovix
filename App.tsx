import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/presentation/context/AuthContext';
import { LoginScreen } from './src/presentation/screens/LoginScreen';
import { DashboardScreen } from './src/presentation/screens/DashboardScreen';
import { AddCattleScreen } from './src/presentation/screens/AddCattleScreen';
import { DailyMilkingScreen } from './src/presentation/screens/DailyMilkingScreen';
import { SettingsScreen } from './src/presentation/screens/SettingsScreen';
import { BottomTabs, TabType } from './src/presentation/components/BottomTabs';
import { DrawerMenu } from './src/presentation/components/DrawerMenu';

const RootNavigation: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [currentTab, setCurrentTab] = useState<TabType>('dashboard');
  const [showAddCattle, setShowAddCattle] = useState(false);
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

  // Show full-screen Add Cattle form (stacked over tabs)
  if (showAddCattle) {
    return (
      <AddCattleScreen
        onCattleAdded={() => {
          setShowAddCattle(false);
          setCurrentTab('dashboard');
        }}
        onCancel={() => setShowAddCattle(false)}
      />
    );
  }

  const renderScreen = () => {
    switch (currentTab) {
      case 'dashboard':
        return (
          <DashboardScreen
            onNavigateToAddCattle={() => setShowAddCattle(true)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        );
      case 'milking':
        return <DailyMilkingScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return (
          <DashboardScreen
            onNavigateToAddCattle={() => setShowAddCattle(true)}
            onOpenDrawer={() => setIsDrawerOpen(true)}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.screenContainer}>{renderScreen()}</View>
      <BottomTabs activeTab={currentTab} onSelectTab={setCurrentTab} />
      <DrawerMenu
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        activeTab={currentTab}
        onSelectTab={setCurrentTab}
        onNavigateToAddCattle={() => setShowAddCattle(true)}
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
