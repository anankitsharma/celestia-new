import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];

export default function MonthlyRecapCard({ innerRef, recap, month, year, streakDays, journalEntries, sunSign }) {
  const monthName = MONTH_NAMES[month - 1] || 'Month';

  return (
    <View ref={innerRef} collapsable={false}>
      <LinearGradient
        colors={['#0E0E22', '#1A1060', '#0E0E22']}
        style={styles.card}>

        <Text style={styles.label}>MONTHLY COSMIC RECAP</Text>
        <Text style={styles.title}>{monthName} {year}</Text>

        {sunSign && (
          <Text style={styles.sign}>{sunSign} Sun</Text>
        )}

        {recap?.headline && (
          <Text style={styles.headline}>"{recap.headline}"</Text>
        )}

        {recap?.summary && (
          <Text style={styles.summary}>{recap.summary}</Text>
        )}

        {recap?.topInsight && (
          <View style={styles.insightBox}>
            <Text style={styles.insightLabel}>TOP INSIGHT</Text>
            <Text style={styles.insightText}>{recap.topInsight}</Text>
          </View>
        )}

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{streakDays || 0}</Text>
            <Text style={styles.statLabel}>Days Active</Text>
          </View>
          <View style={[styles.statItem, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: 'rgba(255,255,255,0.1)' }]}>
            <Text style={styles.statNum}>{journalEntries || 0}</Text>
            <Text style={styles.statLabel}>Journal Entries</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statNum}>{recap?.cosmicScore || '—'}</Text>
            <Text style={styles.statLabel}>Cosmic Score</Text>
          </View>
        </View>

        {recap?.lookAhead && (
          <Text style={styles.lookAhead}>{recap.lookAhead}</Text>
        )}

        <Text style={styles.watermark}>— Celestia</Text>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 20, padding: 24, alignItems: 'center' },
  label: { fontSize: 9, fontFamily: FONTS.sansSemiBold, letterSpacing: 2, color: T.gold, marginBottom: 6 },
  title: { fontFamily: FONTS.serif, fontSize: 28, color: T.cream, marginBottom: 4 },
  sign: { fontSize: 12, color: 'rgba(250,248,242,0.4)', marginBottom: 14 },
  headline: { fontFamily: FONTS.serif, fontSize: 16, color: T.cream, textAlign: 'center', lineHeight: 24, fontStyle: 'italic', marginBottom: 14 },
  summary: { fontSize: 13, color: 'rgba(250,248,242,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 16 },
  insightBox: { backgroundColor: 'rgba(200,168,75,0.1)', borderWidth: 1, borderColor: 'rgba(200,168,75,0.2)', borderRadius: 12, padding: 12, width: '100%', marginBottom: 16 },
  insightLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: T.gold, marginBottom: 6 },
  insightText: { fontSize: 13, color: T.cream, lineHeight: 20 },
  statsRow: { flexDirection: 'row', width: '100%', marginBottom: 16 },
  statItem: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statNum: { fontFamily: FONTS.serif, fontSize: 22, color: T.gold, marginBottom: 2 },
  statLabel: { fontSize: 9, color: 'rgba(250,248,242,0.4)' },
  lookAhead: { fontSize: 12, color: 'rgba(250,248,242,0.5)', textAlign: 'center', lineHeight: 18, fontStyle: 'italic', marginBottom: 8 },
  watermark: { fontSize: 10, color: 'rgba(250,248,242,0.2)', marginTop: 4 },
});
