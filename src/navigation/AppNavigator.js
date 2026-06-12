import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import SplashScreen from '../screens/SplashScreen';
import OnboardingFlowScreen from '../screens/OnboardingFlowScreen';
// HomeScreen (V1) is kept on disk for reference. The Today tab now uses the
// V2 swipe deck below — see HomeScreenV2.js. If you need to consult V1's
// engagement layers, copy them across deliberately rather than reviving this
// import.
import HomeScreenV2 from '../screens/HomeScreenV2';
import LifeAreaDetailScreen from '../screens/LifeAreaDetailScreen';
import TodayReadingDetailScreen from '../screens/TodayReadingDetailScreen';
import ChartScreen from '../screens/ChartScreen';
import TransitsScreen from '../screens/TransitsScreen';
import CompatibilityScreen from '../screens/CompatibilityScreen';
import CompatibilityDetailScreen from '../screens/CompatibilityDetailScreen';
import ChatScreen from '../screens/ChatScreen';
import ReportsScreen from '../screens/ReportsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import JourneyScreen from '../screens/JourneyScreen';
import JournalHistoryScreen from '../screens/JournalHistoryScreen';
import NotificationSettingsScreen from '../screens/NotificationSettingsScreen';
import AuthScreen from '../screens/AuthScreen';
import QuickChartScreen from '../screens/QuickChartScreen';
import JournalScreen from '../screens/JournalScreen';
import PaywallScreen from '../screens/PaywallScreen';
import WelcomeToProScreen from '../screens/WelcomeToProScreen';
import CancelFlowScreen from '../screens/CancelFlowScreen';
import WelcomeBackScreen from '../screens/WelcomeBackScreen';
import YearInReviewScreen from '../screens/YearInReviewScreen';
import TabBar from '../components/TabBar';


const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Today" component={HomeScreenV2} />
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
      <Stack.Screen name="Journey" component={JourneyScreen} />
      <Stack.Screen name="JournalHistory" component={JournalHistoryScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="Auth" component={AuthScreen} />
      <Stack.Screen name="QuickChart" component={QuickChartScreen} />
      <Stack.Screen name="TodaysSky" component={TransitsScreen} />
      <Stack.Screen name="Journal" component={JournalScreen} />
      <Stack.Screen name="Paywall" component={PaywallScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="WelcomeToPro" component={WelcomeToProScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="CancelFlow" component={CancelFlowScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="WelcomeBack" component={WelcomeBackScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="YearInReview" component={YearInReviewScreen} options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      {/* V2 detail screens — pushed from the New tab swipe deck */}
      <Stack.Screen name="LifeAreaDetail" component={LifeAreaDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="TodayReadingDetail" component={TodayReadingDetailScreen} options={{ animation: 'slide_from_right' }} />
      <Stack.Screen name="CompatibilityDetail" component={CompatibilityDetailScreen} options={{ animation: 'slide_from_right' }} />
    </Stack.Navigator>

  );
}
