import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen from '../screens/SplashScreen';
import OnboardingFlowScreen from '../screens/OnboardingFlowScreen';
import HomeScreen from '../screens/HomeScreen';
import ChartScreen from '../screens/ChartScreen';
import TransitsScreen from '../screens/TransitsScreen';
import CompatibilityScreen from '../screens/CompatibilityScreen';
import ChatScreen from '../screens/ChatScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
// V1: JourneyScreen import removed — route unregistered for minimal submission.
import JournalHistoryScreen from '../screens/JournalHistoryScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
// V1: QuickChartScreen removed — was unreachable, "Look up anyone's birth chart" copy.
import JournalScreen from '../screens/JournalScreen';
import TabBar from '../components/TabBar';

// V1: AuthScreen and PaywallScreen are intentionally NOT registered here.
// Their files exist on disk for v1.1 reactivation but are unreachable in v1.
// (See iOS-version/plan/01-code-changes.md Block B.1.)

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  // V1 (PDF plan + audit §5 Option C):
  //  • Chart removed from main tab bar — reachable via Profile → Your Chart.
  //  • Reports removed from main tab bar — reachable via Profile → Deep Readings.
  //  • PDF tab structure: Today / Connections / Ask / Profile.
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
      initialRouteName="Today"
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="Connections" component={CompatibilityScreen} />
      <Tab.Screen name="Ask" component={ChatScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      {/* V1: Journey route unregistered — gamification (streak, level, chapters)
          surface stripped for the minimal-approval submission. JourneyScreen.js
          file retained for v1.1 reactivation. */}
      {/* Profile moved into MainTabs (PDF plan tab structure) */}
      <Stack.Screen name="JournalHistory" component={JournalHistoryScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="TodaysSky" component={TransitsScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      {/* V1: Chart and Reports accessible only via Stack push from Profile,
          not via main tab bar. Reduces 4.3(b) surface area. */}
      <Stack.Screen name="Chart" component={ChartScreen} />
      <Stack.Screen name="Reports" component={ReportsScreen} />
    </Stack.Navigator>
  );
}
