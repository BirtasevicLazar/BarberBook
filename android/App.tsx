import React, { useState } from 'react';
import {
  ActivityIndicator,
  ImageSourcePropType,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import TopNavBar from './src/components/TopNavBar';
import { AuthProvider, useAuth } from './src/contexts/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import ServicesScreen from './src/screens/ServicesScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import TimeOffScreen from './src/screens/TimeOffScreen';
import { palette, theme } from './src/styles/theme';

type TabKey = 'services' | 'working-hours' | 'time-off' | 'appointments';

const serviceIcon: ImageSourcePropType = require('./src/assets/icons/ServiceIcon.png');
const workingHoursIcon: ImageSourcePropType = require('./src/assets/icons/WorkingHours.png');

type NavDefinition = {
  key: TabKey;
  label: string;
  icon?: string;
  asset?: ImageSourcePropType;
  disabled?: boolean;
};

const NAV_ITEMS: NavDefinition[] = [
  { key: 'services', label: 'Usluge', asset: serviceIcon },
  { key: 'working-hours', label: 'Raspored', asset: workingHoursIcon },
  { key: 'time-off', label: 'Neradni dani', icon: 'calendar-remove-outline' },
  { key: 'appointments', label: 'Termini', icon: 'calendar-month-outline', disabled: true },
];

function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <Root />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

function Root() {
  const { isLoading, token } = useAuth();

  if (isLoading) {
    return <FullScreenMessage title="Učitavanje" subtitle="Pripremamo vaš nalog..." mode="loading" />;
  }

  if (!token) {
    return <LoginScreen />;
  }

  return <Dashboard />;
}

function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabKey>('services');
  const { logout } = useAuth();

  return (
    <LinearGradient
      colors={[palette.systemBackground, palette.secondarySystemBackground]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.dashboardGradient}
    >
      <SafeAreaView style={styles.dashboardSafeArea} edges={['bottom']}>
        <TopNavBar 
          navItems={NAV_ITEMS} 
          activeItem={activeTab} 
          onItemPress={(key: string) => setActiveTab(key as TabKey)}
          onLogout={logout}
        />
        <View style={styles.screenWrapper}>{renderScreen(activeTab)}</View>
      </SafeAreaView>
    </LinearGradient>
  );
}

function renderScreen(tab: TabKey) {
  switch (tab) {
    case 'services':
      return <ServicesScreen />;
    case 'working-hours':
      return <ScheduleScreen />;
    case 'time-off':
      return <TimeOffScreen />;
    case 'appointments':
      return (
        <PlaceholderScreen
          title="Termini"
          description="Prikaz termina sa vremenskom mrežom stiže uskoro."
        />
      );
    default:
      return null;
  }
}

interface FullScreenMessageProps {
  title: string;
  subtitle?: string;
  mode?: 'loading' | 'info';
}

function FullScreenMessage({ title, subtitle, mode = 'info' }: FullScreenMessageProps) {
  return (
    <LinearGradient
      colors={[palette.systemBackground, palette.tertiarySystemBackground]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.fullscreenGradient}
    >
      <SafeAreaView style={styles.fullscreenContainer}>
        <View style={styles.fullscreenCard}>
          {mode === 'loading' ? <ActivityIndicator size="small" color={palette.white} /> : null}
          <Text style={styles.fullscreenTitle}>{title}</Text>
          {subtitle ? <Text style={styles.fullscreenSubtitle}>{subtitle}</Text> : null}
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

interface PlaceholderScreenProps {
  title: string;
  description: string;
}

function PlaceholderScreen({ title, description }: PlaceholderScreenProps) {
  return (
    <View style={styles.placeholderContainer}>
      <Text style={styles.placeholderTitle}>{title}</Text>
      <Text style={styles.placeholderDescription}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  dashboardGradient: {
    flex: 1,
  },
  dashboardSafeArea: {
    flex: 1,
  },
  screenWrapper: {
    flex: 1,
  },
  placeholderContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.lg,
    padding: theme.spacing(6),
    justifyContent: 'center',
    gap: theme.spacing(3),
  },
  placeholderTitle: {
    ...theme.typography.title2,
    color: theme.colors.primary,
  },
  placeholderDescription: {
    ...theme.typography.subheadline,
    color: theme.colors.secondary,
  },
  fullscreenGradient: {
    flex: 1,
  },
  fullscreenContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: theme.spacing(6),
  },
  fullscreenCard: {
    width: '100%',
    maxWidth: theme.spacing(40),
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radius.continuous.lg,
    paddingVertical: theme.spacing(8),
    paddingHorizontal: theme.spacing(6),
    alignItems: 'center',
    gap: theme.spacing(3),
    borderWidth: 0.5,
    borderColor: theme.colors.border,
    ...theme.shadows.lg,
  },
  fullscreenTitle: {
    ...theme.typography.headline,
    color: theme.colors.primary,
    textAlign: 'center',
  },
  fullscreenSubtitle: {
    ...theme.typography.footnote,
    color: theme.colors.secondary,
    textAlign: 'center',
  },
});

export default App;
