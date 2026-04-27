import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Platform, StatusBar } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { T, FONTS } from '../constants/theme';
import { getNotificationSettings, saveNotificationSettings, scheduleAllNotifications, hasNotificationPermission, requestNotificationPermission } from '../services/notificationService';
import { useUserProfile } from '../contexts/UserProfileContext';
import { haptic } from '../services/hapticService';
import { useTheme } from '../contexts/ThemeContext';

const CATEGORIES = [
  {
    section: 'DAILY',
    items: [
      { key: 'cosmic_morning', label: 'Morning Briefing', time: '7:30 AM', preview: 'Today\'s themes for you and the people in your life...', icon: '☉' },
      { key: 'evening_reflection', label: 'Evening Reflection', time: '8:30 PM', preview: 'A prompt to journal on your day.', icon: '☽' },
    ],
  },
  {
    section: 'PATTERN ALERTS',
    items: [
      { key: 'transit_alerts', label: 'Pattern Alerts', time: 'When significant', preview: 'A meaningful shift in the week ahead...', icon: '✦' },
      { key: 'weekly_digest', label: 'Weekly Digest', time: 'Sundays 9 AM', preview: 'A short read on the week ahead.', icon: '📅' },
    ],
  },
  {
    section: 'ENGAGEMENT',
    items: [
      { key: 'streak_guardian', label: 'Streak Reminder', time: '9:00 PM', preview: 'Keep your N-day streak alive.', icon: '🔥' },
      { key: 'cosmic_milestones', label: 'Milestones', time: 'When earned', preview: 'New badge unlocked.', icon: '🏅' },
    ],
  },
];

export default function NotificationSettingsScreen({ navigation }) {
  const { colors, isDark } = useTheme();
  const { userProfile } = useUserProfile();
  const [settings, setSettings] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const [showMorningPicker, setShowMorningPicker] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    const [s, perm] = await Promise.all([
      getNotificationSettings(),
      hasNotificationPermission(),
    ]);
    setSettings(s);
    setHasPermission(perm);
  };

  const handleToggle = async (key, value) => {
    haptic.selection();
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    await saveNotificationSettings(updated);
    // Reschedule with new settings (fire and forget)
    scheduleAllNotifications(userProfile, null, null, null, null, null).catch(() => {});
  };

  const handleEnablePermission = async () => {
    haptic.medium();
    const granted = await requestNotificationPermission();
    setHasPermission(granted);
    if (granted) {
      scheduleAllNotifications(userProfile, null, null, null, null, null).catch(() => {});
    }
  };

  const getMorningDate = () => {
    const d = new Date();
    d.setHours(settings?.morningTime ?? 7, settings?.morningMinute ?? 30, 0, 0);
    return d;
  };

  const formatMorningTime = () => {
    const h = settings?.morningTime ?? 7;
    const m = settings?.morningMinute ?? 30;
    const suffix = h >= 12 ? 'PM' : 'AM';
    const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
    return `${hr}:${m.toString().padStart(2, '0')} ${suffix}`;
  };

  const handleMorningTimeChange = async (event, selectedDate) => {
    if (Platform.OS === 'android') {
      setShowMorningPicker(false);
    }
    if (event.type === 'dismissed') return;
    if (!selectedDate) return;
    haptic.selection();
    const updated = {
      ...settings,
      morningTime: selectedDate.getHours(),
      morningMinute: selectedDate.getMinutes(),
    };
    setSettings(updated);
    await saveNotificationSettings(updated);
    scheduleAllNotifications(userProfile, null, null, null, null, null).catch(() => {});
  };

  if (!settings) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const enabledCount = CATEGORIES.flatMap(c => c.items).filter(i => settings[i.key]).length;
  const totalCount = CATEGORIES.flatMap(c => c.items).length;

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      {/* Header */}
      <View style={[s.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={[s.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          accessibilityRole="button"
          accessibilityLabel="Go back">
          <Text style={[s.backText, { color: colors.heading }]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">‹</Text>
        </TouchableOpacity>
        <Text accessibilityRole="header" style={[s.headerTitle, { color: colors.heading }]}>Notifications</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Permission banner */}
        {!hasPermission && (
          <TouchableOpacity style={s.permBanner} activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="Notifications are disabled. Tap to enable."
            onPress={handleEnablePermission}>
            <Text style={s.permTitle}>Notifications are disabled</Text>
            <Text style={[s.permSub, { color: colors.textSecondary }]}>Tap to enable notifications</Text>
          </TouchableOpacity>
        )}

        {/* Summary */}
        <Text style={[s.summary, { color: colors.textSecondary }]}>{enabledCount} of {totalCount} alerts active</Text>

        {/* Category sections */}
        {CATEGORIES.map((cat) => (
          <View key={cat.section}>
            <Text accessibilityRole="header" style={[s.sectionLabel, { color: colors.textSecondary }]}>{cat.section}</Text>
            <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {cat.items.map((item, i) => (
                <React.Fragment key={item.key}>
                  <View style={[s.row, (i < cat.items.length - 1 || (item.key === 'cosmic_morning' && settings.cosmic_morning)) && [s.rowBorder, { borderBottomColor: colors.divider }]]}>
                    <View style={[s.rowIcon, { backgroundColor: colors.cardAlt }]}>
                      <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                    </View>
                    <View style={s.rowContent}>
                      <View style={s.rowTop}>
                        <Text style={[s.rowLabel, { color: colors.heading }]}>{item.label}</Text>
                        <Switch
                          accessibilityLabel={item.label}
                          accessibilityHint={item.preview}
                          value={settings[item.key]}
                          onValueChange={(v) => handleToggle(item.key, v)}
                          trackColor={{ false: isDark ? '#3A3550' : '#E0D8CC', true: 'rgba(200,168,75,0.4)' }}
                          thumbColor={settings[item.key] ? T.gold : isDark ? '#5E587A' : '#F0ECE4'}
                          ios_backgroundColor={isDark ? '#3A3550' : '#E0D8CC'}
                        />
                      </View>
                      <Text style={s.rowTime}>{item.key === 'cosmic_morning' && settings.cosmic_morning ? formatMorningTime() : item.time}</Text>
                      <Text style={[s.rowPreview, { color: colors.textSecondary }]}>{item.preview}</Text>
                    </View>
                  </View>
                  {/* Morning Briefing Time picker row */}
                  {item.key === 'cosmic_morning' && settings.cosmic_morning && (
                    <View style={[s.row, i < cat.items.length - 1 && [s.rowBorder, { borderBottomColor: colors.divider }]]}>
                      <View style={{ width: 36, marginRight: 12 }} />
                      <View style={s.rowContent}>
                        <TouchableOpacity
                          style={s.timePickerRow}
                          activeOpacity={0.7}
                          accessibilityRole="button"
                          accessibilityLabel={`Morning briefing time, ${formatMorningTime()}`}
                          onPress={() => {
                            haptic.selection();
                            setShowMorningPicker(!showMorningPicker);
                          }}
                        >
                          <Text style={[s.timePickerLabel, { color: colors.heading }]}>Morning Briefing Time</Text>
                          <View style={[s.timePickerBadge, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}>
                            <Text style={[s.timePickerValue, { color: T.gold }]}>{formatMorningTime()}</Text>
                          </View>
                        </TouchableOpacity>
                        {showMorningPicker && (
                          <DateTimePicker
                            value={getMorningDate()}
                            mode="time"
                            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                            minuteInterval={5}
                            onChange={handleMorningTimeChange}
                            textColor={isDark ? '#FFFFFF' : '#000000'}
                            themeVariant={isDark ? 'dark' : 'light'}
                            style={s.timePicker}
                          />
                        )}
                      </View>
                    </View>
                  )}
                </React.Fragment>
              ))}
            </View>
          </View>
        ))}

        {/* Quiet Hours */}
        <Text style={[s.sectionLabel, { color: colors.textSecondary }]}>QUIET HOURS</Text>
        <View style={[s.sectionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={s.row}>
            <View style={[s.rowIcon, { backgroundColor: colors.cardAlt }]}>
              <Text style={{ fontSize: 16 }}>🌙</Text>
            </View>
            <View style={s.rowContent}>
              <View style={s.rowTop}>
                <Text style={[s.rowLabel, { color: colors.heading }]}>Enable quiet hours</Text>
                <Switch
                  accessibilityLabel="Enable quiet hours"
                  value={settings.quietHoursEnabled}
                  onValueChange={(v) => handleToggle('quietHoursEnabled', v)}
                  trackColor={{ false: isDark ? '#3A3550' : '#E0D8CC', true: 'rgba(200,168,75,0.4)' }}
                  thumbColor={settings.quietHoursEnabled ? T.gold : isDark ? '#5E587A' : '#F0ECE4'}
                  ios_backgroundColor={isDark ? '#3A3550' : '#E0D8CC'}
                />
              </View>
              {settings.quietHoursEnabled && (
                <Text style={[s.quietRange, { color: colors.heading }]}>
                  {formatHour(settings.quietHoursStart)} — {formatHour(settings.quietHoursEnd)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <Text style={[s.footer, { color: colors.textSecondary }]}>
          Celestia uses local notifications only. No data is sent to external servers.
        </Text>

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

function formatHour(h) {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hr = h > 12 ? h - 12 : h === 0 ? 12 : h;
  return `${hr}:00 ${suffix}`;
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight || 44) + 12, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: T.border },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: T.white, borderWidth: 1, borderColor: T.border, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 22, color: T.navy, marginTop: -2 },
  headerTitle: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy },

  permBanner: { margin: 20, marginBottom: 0, backgroundColor: 'rgba(200,168,75,0.08)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.25)', borderRadius: 14, padding: 16, alignItems: 'center' },
  permTitle: { fontSize: 14, fontFamily: FONTS.sansSemiBold, color: T.gold, marginBottom: 3 },
  permSub: { fontSize: 12, color: T.stone },

  summary: { fontSize: 12, color: T.stone, textAlign: 'center', marginTop: 16, marginBottom: 4 },

  sectionLabel: { fontSize: 10, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.stone, paddingHorizontal: 20, marginTop: 20, marginBottom: 8 },
  sectionCard: { marginHorizontal: 20, backgroundColor: 'white', borderRadius: 17, borderWidth: 1, borderColor: T.border, overflow: 'hidden' },

  row: { flexDirection: 'row', padding: 14, paddingRight: 16 },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#F5F0E6' },
  rowIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: T.warm, alignItems: 'center', justifyContent: 'center', marginRight: 12, marginTop: 2 },
  rowContent: { flex: 1 },
  rowTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 },
  rowLabel: { fontSize: 14, fontFamily: FONTS.sansMedium, color: T.navy, flex: 1, marginRight: 10 },
  rowTime: { fontSize: 11, color: T.gold, marginBottom: 3 },
  rowPreview: { fontSize: 11.5, color: T.stone, fontStyle: 'italic', lineHeight: 16 },

  quietRange: { fontSize: 13, color: T.navy, marginTop: 6, fontFamily: FONTS.sansMedium },

  timePickerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timePickerLabel: { fontSize: 13, fontFamily: FONTS.sansMedium, color: T.navy },
  timePickerBadge: { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, borderWidth: 1, borderColor: T.border, backgroundColor: T.warm },
  timePickerValue: { fontSize: 13, fontFamily: FONTS.sansSemiBold, color: T.gold },
  timePicker: { marginTop: 8 },

  footer: { fontSize: 11, color: T.stone, textAlign: 'center', paddingHorizontal: 40, marginTop: 24, lineHeight: 17 },
});
