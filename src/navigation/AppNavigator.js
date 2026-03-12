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
import JournalHistoryScreen from '../screens/JournalHistoryScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AuthScreen from '../screens/AuthScreen';
import QuickChartScreen from '../screens/QuickChartScreen';
import JournalScreen from '../screens/JournalScreen';
import PaywallScreen from '../screens/PaywallScreen';
import TabBar from '../components/TabBar';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Today" component={HomeScreen} />
      <Tab.Screen name="AskAI" component={ChatScreen} />
      <Tab.Screen name="Chart" component={ChartScreen} />
      <Tab.Screen name="Circle" component={CompatibilityScreen} />
      <Tab.Screen name="Reports" component={ReportsScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: 'fade' }}>
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="OnboardingFlow" component={OnboardingFlowScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="JournalHistory" component={JournalHistoryScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="QuickChart" component={QuickChartScreen} />
      <Stack.Screen name="TodaysSky" component={TransitsScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
    </Stack.Navigator>

  );
}
