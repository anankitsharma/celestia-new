import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Platform, StatusBar } from 'react-native';
import { T, FONTS } from '../constants/theme';
import { getNotificationSettings, saveNotificationSettings, scheduleAllNotifications, hasNotificationPermission, requestNotificationPermission } from '../services/notificationService';
import { useUserProfile } from '../contexts/UserProfileContext';
import { haptic } from '../services/hapticService';

const CATEGORIES = [
  {
    section: 'DAILY',
    items: [
      { key: 'cosmic_morning', label: 'Morning Cosmic Briefing', time: '7:30 AM', preview: 'Moon enters Scorpio today...', icon: '☉' },
      { key: 'evening_reflection', label: 'Evening Reflection', time: '8:30 PM', preview: 'What did the universe teach you?', icon: '☽' },
    ],
  },
  {
    section: 'COSMIC EVENTS',
    items: [
      { key: 'transit_alerts', label: 'Transit Alerts', time: 'When significant', preview: 'Jupiter enters your Sun sign...', icon: '✦' },
      { key: 'weekly_digest', label: 'Weekly Cosmic Digest', time: 'Sundays 9 AM', preview: 'Your week ahead: transformation...', icon: '📅' },
    ],
  },
  {
    section: 'ENGAGEMENT',
    items: [
      { key: 'streak_guardian', label: 'Streak Guardian', time: '9:00 PM', preview: '14-day streak at risk...', icon: '🔥' },
      { key: 'cosmic_milestones', label: 'Cosmic Milestones', time: 'When earned', preview: 'New badge: Moon Cycle Master...', icon: '🏅' },
    ],
  },
];

export default function NotificationSettingsScreen({ navigation }) {
  const { userProfile } = useUserProfile();
  const [settings, setSettings] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);

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

  if (!settings) return <View style={{ flex: 1, backgroundColor: T.cream }} />;

  const enabledCount = CATEGORIES.flatMap(c => c.items).filter(i => settings[i.key]).length;
  const totalCount = CATEGORIES.flatMap(c => c.items).length;

  return (
    <View style={{ flex: 1, backgroundColor: T.cream }}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={s.backBtn}>
          <Text style={s.backText}>‹</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Cosmic Alerts</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Permission banner */}
        {!hasPermission && (
          <TouchableOpacity style={s.permBanner} activeOpacity={0.8} onPress={handleEnablePermission}>
            <Text style={s.permTitle}>Notifications are disabled</Text>
            <Text style={s.permSub}>Tap to enable cosmic alerts</Text>
          </TouchableOpacity>
        )}

        {/* Summary */}
        <Text style={s.summary}>{enabledCount} of {totalCount} alerts active</Text>

        {/* Category sections */}
        {CATEGORIES.map((cat) => (
          <View key={cat.section}>
            <Text style={s.sectionLabel}>{cat.section}</Text>
            <View style={s.sectionCard}>
              {cat.items.map((item, i) => (
                <View key={item.key} style={[s.row, i < cat.items.length - 1 && s.rowBorder]}>
                  <View style={s.rowIcon}>
                    <Text style={{ fontSize: 16 }}>{item.icon}</Text>
                  </View>
                  <View style={s.rowContent}>
                    <View style={s.rowTop}>
                      <Text style={s.rowLabel}>{item.label}</Text>
                      <Switch
                        value={settings[item.key]}
                        onValueChange={(v) => handleToggle(item.key, v)}
                        trackColor={{ false: '#E0D8CC', true: 'rgba(200,168,75,0.4)' }}
                        thumbColor={settings[item.key] ? T.gold : '#F0ECE4'}
                        ios_backgroundColor="#E0D8CC"
                      />
                    </View>
                    <Text style={s.rowTime}>{item.time}</Text>
                    <Text style={s.rowPreview}>{item.preview}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        ))}

        {/* Quiet Hours */}
        <Text style={s.sectionLabel}>QUIET HOURS</Text>
        <View style={s.sectionCard}>
          <View style={s.row}>
            <View style={s.rowIcon}>
              <Text style={{ fontSize: 16 }}>🌙</Text>
            </View>
            <View style={s.rowContent}>
              <View style={s.rowTop}>
                <Text style={s.rowLabel}>Enable quiet hours</Text>
                <Switch
                  value={settings.quietHoursEnabled}
                  onValueChange={(v) => handleToggle('quietHoursEnabled', v)}
                  trackColor={{ false: '#E0D8CC', true: 'rgba(200,168,75,0.4)' }}
                  thumbColor={settings.quietHoursEnabled ? T.gold : '#F0ECE4'}
                  ios_backgroundColor="#E0D8CC"
                />
              </View>
              {settings.quietHoursEnabled && (
                <Text style={s.quietRange}>
                  {formatHour(settings.quietHoursStart)} — {formatHour(settings.quietHoursEnd)}
                </Text>
              )}
            </View>
          </View>
        </View>

        <Text style={s.footer}>
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

  footer: { fontSize: 11, color: T.stone, textAlign: 'center', paddingHorizontal: 40, marginTop: 24, lineHeight: 17 },
});
