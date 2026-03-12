import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Keyboard, Platform, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import {
  Star,
  Sparkles,
  Compass,
  Users,
  ScrollText
} from 'lucide-react-native';
import { T, FONTS } from '../constants/theme';

const { width } = Dimensions.get('window');

const TABS = [
  { icon: Star, label: 'Today', name: 'Today' },
  { icon: Sparkles, label: 'Ask', name: 'AskAI' },
  { icon: Compass, label: 'Chart', name: 'Chart' },
  { icon: Users, label: 'Circle', name: 'Circle' },
  { icon: ScrollText, label: 'Reports', name: 'Reports' },
];

export default function TabBar({ state, navigation }) {
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { subShow.remove(); subHide.remove(); };
  }, []);

  if (keyboardVisible) return null;

  return (
    <View style={styles.outerContainer}>
      <BlurView
        intensity={Platform.OS === 'ios' ? 90 : 0}
        tint="light"
        style={styles.blurContainer}
      >
        <View style={styles.container}>
          {state.routes.map((route, i) => {
            const active = state.index === i;
            const tab = TABS.find(t => t.name === route.name) || TABS[i];
            const Icon = tab.icon;

            return (
              <TouchableOpacity
                key={i}
                style={styles.tab}
                activeOpacity={0.7}
                onPress={() => navigation.navigate(route.name)}
              >
                <View style={styles.iconContainer}>
                  {active && <View style={styles.pill} />}
                  <Icon
                    size={24}
                    color={active ? T.gold : '#A1A1AA'}
                    strokeWidth={active ? 2.5 : 2}
                  />
                </View>
                <Text style={[
                  styles.label,
                  {
                    color: active ? T.navy : '#A1A1AA',
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
    bottom: Platform.OS === 'ios' ? 34 : 24,
    left: 16,
    right: 16,
    borderRadius: 34,
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : 'rgba(255,255,255,0.98)',
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
    borderColor: 'rgba(255,255,255,0.2)',
  },
  blurContainer: {
    flex: 1,
  },
  container: {
    flexDirection: 'row',
    height: 72,
    alignItems: 'center',
    paddingHorizontal: 10,
    backgroundColor: Platform.OS === 'ios' ? 'rgba(255,255,255,0.85)' : 'transparent',
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
    backgroundColor: 'rgba(200,168,75,0.12)',
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
  },
});
