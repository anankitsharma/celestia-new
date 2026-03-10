import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { T, FONTS } from '../constants/theme';

const TABS = [
  { icon: '◎', label: 'Today' },
  { icon: '✧', label: 'Ask AI' },
  { icon: '✦', label: 'Chart' },
  { icon: '♡', label: 'Match' },
  { icon: '☽', label: 'Sky' },
  { icon: '◑', label: 'Reports' },
];

export default function TabBar({ state, navigation }) {
  return (
    <View style={styles.container}>
      {state.routes.map((route, i) => {
        const active = state.index === i;
        const tab = TABS[i];
        return (
          <TouchableOpacity
            key={i}
            style={styles.tab}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(route.name)}
          >
            <View style={[styles.bubble, active && styles.bubbleActive]}>
              <Text style={[styles.icon, { color: active ? T.gold : '#C0B8A4', fontSize: active ? 20 : 18 }]}>
                {tab.icon}
              </Text>
              {active && <View style={styles.dot} />}
            </View>
            <Text style={[styles.label, { color: active ? T.navy : '#C0B8A4' }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    height: 86,
    backgroundColor: 'rgba(250,248,242,0.93)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.07)',
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  bubble: {
    width: 48,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleActive: {
    backgroundColor: 'rgba(200,168,75,0.13)',
  },
  dot: {
    position: 'absolute',
    bottom: -5,
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: T.gold,
  },
  icon: { fontSize: 19 },
  label: { fontSize: 9.5, fontWeight: '500', letterSpacing: 0.2 },
});
