import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Star,
  Sparkles,
  Compass,
  Users,
  ScrollText
} from 'lucide-react-native';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

const { width } = Dimensions.get('window');

const TABS = [
  { icon: Star, label: 'Today', name: 'Today' },
  { icon: Sparkles, label: 'Ask', name: 'AskAI' },
  { icon: Compass, label: 'Chart', name: 'Chart' },
  { icon: Users, label: 'Circle', name: 'Circle' },
  { icon: ScrollText, label: 'Reports', name: 'Reports' },
];

export default function TabBar({ state, navigation }) {
  const insets = useSafeAreaInsets();
  const { isDark, colors } = useTheme();
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { subShow.remove(); subHide.remove(); };
  }, []);

  // Hide tab bar when AskAI is active (immersive chat mode)
  const currentRoute = state.routes[state.index]?.name;
  if (keyboardVisible || currentRoute === 'AskAI') return null;

  return (
    <View style={[
      styles.outerContainer,
      {
        bottom: Math.max(insets.bottom, 10) + 14,
        backgroundColor: Platform.OS === 'ios' ? 'transparent' : colors.tabBarBg,
        borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.2)',
      },
    ]}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 90 : 0}
        tint={isDark ? 'dark' : 'light'}
        style={styles.blurContainer}
      >
        <View style={[
          styles.container,
          {
            backgroundColor: Platform.OS === 'ios'
              ? (isDark ? 'rgba(26,23,20,0.82)' : 'rgba(255,255,255,0.85)')
              : 'transparent',
          },
        ]}>
          {state.routes.map((route, i) => {
            const active = state.index === i;
            const tab = TABS.find(t => t.name === route.name) || TABS[i];
            const Icon = tab.icon;

            return (
              <TouchableOpacity
                key={i}
                style={styles.tab}
                activeOpacity={0.7}
                onPress={() => {
                  if (route.name === 'AskAI') {
                    // Pass current tab so ChatScreen can dismiss back to it
                    navigation.navigate('AskAI', { previousTab: currentRoute });
                  } else {
                    navigation.navigate(route.name);
                  }
                }}
              >
                <View style={styles.iconContainer}>
                  {active && <View style={[styles.pill, { backgroundColor: colors.goldDim }]} />}
                  <Icon
                    size={24}
                    color={active ? colors.gold : colors.textMuted}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </View>
                <Text style={[
                  styles.label,
                  {
                    color: active ? colors.heading : colors.textMuted,
                    fontWeight: active ? '700' : '500'
                  }
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 34,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.12,
        shadowRadius: 16,
      },
      android: {
        elevation: 10,
      },
    }),
    overflow: 'hidden',
    borderWidth: 1,
  },
  blurContainer: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 64,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  pill: {
    position: 'absolute',
    width: 56,
    height: 32,
    borderRadius: 16,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
