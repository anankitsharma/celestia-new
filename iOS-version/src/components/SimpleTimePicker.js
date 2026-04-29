// SimpleTimePicker.js
//
// A 24-hour time picker built from two snap-scrolling ScrollViews. We are not
// using @react-native-community/datetimepicker here — its `display="spinner"`
// (UIDatePicker.wheels) has a confirmed bug on iPadOS 26.1 where toggling the
// AM/PM column resets the hour/minute spinners to a default. Setting
// `is24Hour={true}` on iOS is a *hint* that the system can override based on
// device locale, so it isn't a reliable fix either.
//
// This component sidesteps both: pure RN, two columns (00–23 hours, 00–59
// minutes), no AM/PM column at all. The "Selected:" preview elsewhere in the
// app still formats the chosen Date via `toLocaleTimeString` so the user sees
// "02:30 PM" — only the picker UI is 24-hour.
//
// Usage:
//   <SimpleTimePicker
//     value={birthTime}                // Date | null
//     onChange={(date) => setX(date)}  // Date
//     theme={{                         // optional, defaults to gold/stone
//       selectedColor: '#C8A84B',
//       dimColor: '#97907F',
//       highlightBg: 'rgba(200,168,75,0.08)',
//       highlightBorder: 'rgba(200,168,75,0.30)',
//     }}
//   />

import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 5;                                 // 2 above + center + 2 below
const VERTICAL_PAD = ITEM_HEIGHT * Math.floor(VISIBLE_ROWS / 2); // 88px

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

const DEFAULT_THEME = {
  selectedColor: '#C8A84B',
  dimColor: '#97907F',
  highlightBg: 'rgba(200,168,75,0.08)',
  highlightBorder: 'rgba(200,168,75,0.30)',
};

export default function SimpleTimePicker({ value, onChange, theme }) {
  const initialHour = (value && typeof value.getHours === 'function') ? value.getHours() : 10;
  const initialMinute = (value && typeof value.getMinutes === 'function') ? value.getMinutes() : 0;

  const [hour, setHour] = useState(initialHour);
  const [minute, setMinute] = useState(initialMinute);

  const hourScrollRef = useRef(null);
  const minuteScrollRef = useRef(null);

  // Snap each column to the initial value once the layout has settled.
  useEffect(() => {
    const t = setTimeout(() => {
      hourScrollRef.current?.scrollTo({ y: initialHour * ITEM_HEIGHT, animated: false });
      minuteScrollRef.current?.scrollTo({ y: initialMinute * ITEM_HEIGHT, animated: false });
    }, 50);
    return () => clearTimeout(t);
    // initialHour/initialMinute only matter on first mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const t = { ...DEFAULT_THEME, ...(theme || {}) };

  const commit = (h, m) => {
    const base = (value && typeof value.getTime === 'function') ? new Date(value) : new Date(2000, 0, 1);
    base.setHours(h, m, 0, 0);
    onChange?.(base);
  };

  const handleHourScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const next = Math.max(0, Math.min(23, idx));
    if (next !== hour) {
      setHour(next);
      commit(next, minute);
    }
  };

  const handleMinuteScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.y / ITEM_HEIGHT);
    const next = Math.max(0, Math.min(59, idx));
    if (next !== minute) {
      setMinute(next);
      commit(hour, next);
    }
  };

  const renderColumn = (items, current, scrollRef, onEnd, accessibilityLabel) => (
    <ScrollView
      ref={scrollRef}
      showsVerticalScrollIndicator={false}
      snapToInterval={ITEM_HEIGHT}
      decelerationRate="fast"
      onMomentumScrollEnd={onEnd}
      style={styles.column}
      contentContainerStyle={{ paddingTop: VERTICAL_PAD, paddingBottom: VERTICAL_PAD }}
      accessibilityLabel={accessibilityLabel}
    >
      {items.map((i) => {
        const isSelected = i === current;
        return (
          <View key={i} style={styles.item}>
            <Text
              style={[
                styles.itemText,
                { color: isSelected ? t.selectedColor : t.dimColor },
                isSelected && styles.itemTextSelected,
              ]}
            >
              {String(i).padStart(2, '0')}
            </Text>
          </View>
        );
      })}
    </ScrollView>
  );

  return (
    <View style={styles.container} accessibilityLabel="Time picker, hours and minutes">
      <View
        pointerEvents="none"
        style={[
          styles.highlight,
          { backgroundColor: t.highlightBg, borderColor: t.highlightBorder },
        ]}
      />
      {renderColumn(HOURS, hour, hourScrollRef, handleHourScrollEnd, 'Hour, 0 to 23')}
      <Text style={styles.colon}>:</Text>
      {renderColumn(MINUTES, minute, minuteScrollRef, handleMinuteScrollEnd, 'Minute, 0 to 59')}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    position: 'relative',
  },
  highlight: {
    position: 'absolute',
    top: VERTICAL_PAD,
    height: ITEM_HEIGHT,
    left: 0,
    right: 0,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderRadius: 2,
  },
  column: {
    width: 92,
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemText: {
    fontSize: 22,
    fontVariant: ['tabular-nums'],
  },
  itemTextSelected: {
    fontWeight: '600',
  },
  colon: {
    fontSize: 22,
    marginHorizontal: 6,
    color: '#97907F',
    fontWeight: '500',
  },
});
