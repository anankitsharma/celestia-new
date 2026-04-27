import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';

export default function QuestCard({ quests, allComplete, weeklyCount }) {
  const { colors, isDark } = useTheme();
  if (!quests || quests.length === 0) return null;

  const completedCount = quests.filter(q => q.completed).length;

  return (
    <View style={[s.card, { backgroundColor: colors.card, borderColor: isDark ? 'rgba(200,168,75,0.1)' : 'rgba(200,168,75,0.15)' }]}>
      <View style={s.header}>
        <View style={{ flex: 1 }}>
          <Text style={[s.label, { color: colors.textSecondary }]}>TODAY THE COSMOS ASKS</Text>
          <Text style={[s.sub, { color: colors.text }]}>{allComplete ? 'Chapter complete! +30 bonus XP' : `${completedCount}/3 answered`}</Text>
        </View>
        {weeklyCount > 0 && (
          <View style={s.weekBadge}>
            <Text style={s.weekText}>{weeklyCount}/7 this week</Text>
          </View>
        )}
      </View>

      {quests.map((q, i) => (
        <View key={q.id || i} style={[s.questRow, q.completed && s.questComplete, { borderBottomColor: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)' }]}>
          <View style={[s.check, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)' }, q.completed && s.checkDone]}>
            {q.completed && <Text style={s.checkMark}>✓</Text>}
          </View>
          <Text style={[s.questIcon, { color: colors.textSecondary }]}>{q.icon}</Text>
          <Text style={[s.questText, { color: colors.text }, q.completed && { textDecorationLine: 'line-through', color: colors.textMuted }]}>{q.label}</Text>
          {q.completed && <Text style={s.xpChip}>+15 XP</Text>}
        </View>
      ))}

      {allComplete && (
        <View style={s.bonusRow}>
          <Text style={s.bonusIcon}>✦</Text>
          <Text style={s.bonusText}>Story bonus earned!</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(200,168,75,0.15)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 10,
    letterSpacing: 1.5,
    color: T.stone,
    fontFamily: FONTS.sansSemiBold,
    marginBottom: 2,
  },
  sub: {
    fontSize: 12,
    color: T.ink,
    fontFamily: FONTS.sansMedium,
  },
  weekBadge: {
    backgroundColor: 'rgba(200,168,75,0.1)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  weekText: {
    fontSize: 10,
    color: T.gold,
    fontFamily: FONTS.sansMedium,
  },
  questRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.04)',
    gap: 10,
  },
  questComplete: {
    opacity: 0.6,
  },
  check: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkDone: {
    backgroundColor: T.gold,
    borderColor: T.gold,
  },
  checkMark: {
    fontSize: 11,
    color: 'white',
    fontWeight: '700',
  },
  questIcon: {
    fontSize: 16,
    width: 22,
    textAlign: 'center',
  },
  questText: {
    flex: 1,
    fontSize: 13,
    color: T.ink,
    fontFamily: FONTS.sans,
  },
  questTextDone: {
    textDecorationLine: 'line-through',
    color: T.stone,
  },
  xpChip: {
    fontSize: 10,
    color: T.gold,
    fontFamily: FONTS.sansMedium,
    backgroundColor: 'rgba(200,168,75,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  bonusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 12,
    backgroundColor: 'rgba(200,168,75,0.08)',
    borderRadius: 12,
    paddingVertical: 10,
  },
  bonusIcon: {
    fontSize: 14,
    color: T.gold,
  },
  bonusText: {
    fontSize: 12,
    color: T.gold,
    fontFamily: FONTS.sansSemiBold,
  },
});
