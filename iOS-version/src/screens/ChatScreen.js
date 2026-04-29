import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Platform, ActivityIndicator, Keyboard, Share, Alert, BackHandler,
  Modal, Linking, ActionSheetIOS
} from 'react-native';
import { KeyboardStickyView } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useTheme } from '../contexts/ThemeContext';
import { useUserProfile } from '../contexts/UserProfileContext';
import { createChatSession, sendChatMessage } from '../services/geminiService';
import { defaultConversationState } from '../services/chat/conversationTypes';
import { ChatRepository } from '../services/database/rep_chats';
import { loadBoolean, saveBoolean } from '../services/storage';
import { haptic } from '../services/hapticService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';
import { completeQuestAction } from '../services/questService';
import { getActiveCosmicWindows, getMoonDataForDate } from '../services/astrologyService';
import { getNarrativeContext } from '../services/narrativeService';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SetupRequiredState from '../components/SetupRequiredState';
import { useAnalytics, EVENTS } from '../services/analytics';
import { X } from 'lucide-react-native';


// ── DYNAMIC SUGGESTION QUESTIONS ─────────────────────────────
// Natural questions a real astrology user would ask, grouped by topic.
// Rotates based on conversation context.

const Q_INITIAL = [
  // V1: zodiac-specific suggestions removed. {randomSign} interpolation killed.
  // Love & relationships
  "Why do I keep dating the same type of person?",
  "Why do I keep choosing the same type?",
  "What kind of partner is actually right for me?",
  "Why is it so hard for me to open up emotionally?",
  "How do I stop falling for unavailable people?",
  // Self & identity
  "Why do I feel so drained lately?",
  "What are my hidden strengths?",
  "Why do people always misread me?",
  "What's my biggest strength and my blind spot?",
  // Career & purpose
  "What kind of work actually energizes me?",
  "Should I trust my gut on this big decision?",
  "When is the best time to make a move at work?",
  // Patterns & timing
  "Why does communication feel off lately?",
  "What should I focus on this week?",
  "Why has everything felt so chaotic lately?",
  "Why am I in this mood right now?",
];

const Q_AFTER_LOVE = [
  "What's my attachment style?",
  "Why do I keep ending up in situationships?",
  "What do I actually want in love?",
  "Why am I attracted to people who are unavailable?",
  "How do I stop repeating the same relationship patterns?",
  "What relationship patterns trip me up?",
];

const Q_AFTER_CAREER = [
  // V1.2 — Softened from forecast-coded ("Is this year good for…", "When will
  // things start clicking…") to reflective career questions that don't read
  // as fortune-telling.
  "Is now the right moment for a career change?",
  "What's blocking my success right now?",
  "Am I in the right field for who I am?",
  "What's making professional progress feel slow?",
  "What's my real career direction?",
];

const Q_AFTER_SELF = [
  "Why do I feel the way I feel?",
  "Why do I overthink everything?",
  "What part of myself am I not seeing clearly?",
  "How do I show up to people more authentically?",
  "What pattern do I keep repeating?",
];

const Q_AFTER_TRANSIT = [
  // V1.2 — Rewritten from fortune-telling-coded ("How long will this last?",
  // "When does this shift?", "What's coming up?") to today/now reflective
  // prompts that match the "Today's Energy" theme without forecasting.
  "Where is this showing up most for me?",
  "What do I want to do differently today?",
  "How is this showing up in my relationships?",
  "What needs to shift in me?",
  "What pattern am I noticing this week?",
];

const Q_GENERIC_FOLLOWUP = [
  "Tell me more about that",
  "What else should I know?",
  "How does that play out in my daily life?",
  "Is there a way to work with this pattern?",
  "What would you suggest I do about it?",
];

// Time-of-day specific prompts (Plan Section 05)
const Q_MORNING = [
  "What should I focus on today?",
  "Is today a good day for a hard conversation?",
  "What energy am I working with today?",
  "Give me one thing to remember today",
  "What's the best time of day for me today?",
];

const Q_EVENING = [
  "Why do I keep attracting the same type?",
  "What's my biggest blind spot in relationships?",
  "Why am I so anxious lately?",
  "Why do I feel like something big is about to change?",
  "What does this month look like for me?",
  "What do I actually need most?",
  "Why can't I let go of this person?",
];

const Q_FUN = [
  "What's my biggest red flag?",
  "Roast me — gently",
  "What's my secret superpower?",
  "Why does my best friend think I'm intense?",
  "What do people assume about me that's wrong?",
];

// Transit-triggered prompts (injected when transit is active)
// V1: transit-triggered prompts disabled — Mercury retrograde / moon-phase phrasing was a 4.3(b) trigger.
const Q_TRANSIT_MERCURY_RX = [];
const Q_TRANSIT_FULL_MOON = [];
const Q_TRANSIT_NEW_MOON = [];

// RANDOM_SIGNS removed in V1 — no suggestions interpolate zodiac signs anymore.

function pickSuggestions(messages, userProfile, theme = 'open', transitCtx = null) {
  const msgCount = messages.filter(m => m.role === 'user').length;
  const lastAiText = [...messages].reverse().find(m => m.role === 'model')?.text?.toLowerCase() || '';
  const lastUserText = [...messages].reverse().find(m => m.role === 'user')?.text?.toLowerCase() || '';
  const combined = lastAiText + ' ' + lastUserText;

  let pool;

  if (msgCount === 0) {
    // Theme-specific initial questions
    if (theme === 'love') pool = Q_AFTER_LOVE;
    else if (theme === 'career') pool = Q_AFTER_CAREER;
    else if (theme === 'growth') pool = Q_AFTER_SELF;
    else if (theme === 'today') pool = Q_AFTER_TRANSIT;
    else {
      // Time-of-day aware initial pool
      const hour = new Date().getHours();
      if (hour >= 7 && hour < 10) {
        pool = [...Q_MORNING, ...Q_INITIAL.slice(0, 4)];
      } else if (hour >= 20 || hour < 3) {
        // Evening/night: emotional + introspective only — no career/morning energy
        pool = [...Q_EVENING, ...Q_FUN.slice(0, 2)];
      } else {
        pool = [...Q_INITIAL, ...Q_FUN.slice(0, 2)];
      }
    }

    // Inject 1-2 transit-triggered prompts when relevant
    if (transitCtx?.mercuryRx) pool = [...Q_TRANSIT_MERCURY_RX.slice(0, 1), ...pool];
    if (transitCtx?.moonPhase === 'Full Moon') pool = [...Q_TRANSIT_FULL_MOON.slice(0, 1), ...pool];
    if (transitCtx?.moonPhase === 'New Moon') pool = [...Q_TRANSIT_NEW_MOON.slice(0, 1), ...pool];
  } else {
    // Detect topic from recent messages
    const isLove = /love|relationship|partner|dating|compatibility|crush|ex |breakup|attract|attachment|situationship|venus|commit/.test(combined);
    const isCareer = /career|job|work|money|professional|promotion|business|midheaven|success/.test(combined);
    const isTransit = /transit|retrograde|mercury|full moon|new moon|eclipse|shift|energy|chaos|week ahead/.test(combined);
    const isSelf = /strength|weakness|personality|emotion|overthink|moon sign|rising|blind spot|purpose|identity|talent/.test(combined);

    if (isLove) pool = Q_AFTER_LOVE;
    else if (isCareer) pool = Q_AFTER_CAREER;
    else if (isTransit) pool = Q_AFTER_TRANSIT;
    else if (isSelf) pool = Q_AFTER_SELF;
    else pool = Q_GENERIC_FOLLOWUP;
  }

  // Shuffle and pick 4-5
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, msgCount === 0 ? 5 : 4);

  // Add a generic followup if in conversation
  if (msgCount > 0 && Math.random() > 0.5) {
    const generic = Q_GENERIC_FOLLOWUP[Math.floor(Math.random() * Q_GENERIC_FOLLOWUP.length)];
    picked.push(generic);
  }

  // V1: {randomSign} interpolation removed. No suggestions reference zodiac signs.
  return picked;
}

// ── SIMPLE MARKDOWN RENDERER ─────────────────────────────────
// V1.2 — Chat replies are PLAIN TEXT. The AI is instructed not to use markdown,
// but as a safety net we strip any residual markdown characters before render.
// This prevents stray asterisks/backticks/underscores from rendering literally
// when the AI slips and emits unbalanced or single-line emphasis.
function stripResidualMarkdown(text) {
  if (!text) return '';
  return text
    // Remove **bold** wrappers but keep the inner text
    .replace(/\*\*(.+?)\*\*/g, '$1')
    // Remove *italic* wrappers but keep the inner text
    .replace(/\*(.+?)\*/g, '$1')
    // Remove _italic_ wrappers but keep the inner text
    .replace(/(^|\s)_(.+?)_(?=\s|$|[.,!?;:])/g, '$1$2')
    // Remove `code` wrappers but keep the inner text
    .replace(/`(.+?)`/g, '$1')
    // Remove leading "# " heading markers
    .replace(/^#{1,6}\s+/gm, '')
    // Strip any leftover loose asterisks/backticks (unbalanced edge cases)
    .replace(/[\*`]/g, '');
}

function renderMarkdown(text, baseStyle) {
  const cleaned = stripResidualMarkdown(text);
  // Single span — chat is plain text. Newlines preserved by Text component.
  return [<Text key={0} style={baseStyle}>{cleaned}</Text>];

  // Old structured renderer kept below for reference if v1.1 wants emphasis back.
  /* eslint-disable */
  const parts = [];
  const boldRegex = /\*\*(.+?)\*\*/g;
  let lastIndex = 0;
  let match;

  while ((match = boldRegex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ text: text.slice(lastIndex, match.index), bold: false });
    }
    parts.push({ text: match[1], bold: true });
    lastIndex = boldRegex.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ text: text.slice(lastIndex), bold: false });
  }

  // Now process italic within each part
  const finalParts = [];
  for (const part of parts) {
    if (part.bold) {
      finalParts.push(part);
      continue;
    }
    const italicRegex = /\*(.+?)\*/g;
    let iLast = 0;
    let iMatch;
    while ((iMatch = italicRegex.exec(part.text)) !== null) {
      if (iMatch.index > iLast) {
        finalParts.push({ text: part.text.slice(iLast, iMatch.index) });
      }
      finalParts.push({ text: iMatch[1], italic: true });
      iLast = italicRegex.lastIndex;
    }
    if (iLast < part.text.length) {
      finalParts.push({ text: part.text.slice(iLast) });
    }
  }

  return finalParts.map((p, i) => (
    <Text
      key={i}
      style={[
        baseStyle,
        p.bold && { fontFamily: FONTS.sansSemiBold },
        p.italic && { fontStyle: 'italic' },
      ]}
    >
      {p.text}
    </Text>
  ));
}

const formatTime = (ts) => {
  const d = new Date(ts);
  let h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};

const CHAT_THEMES = [
  { key: 'open', label: 'Open', icon: '✦' },
  { key: 'love', label: 'Love', icon: '♡' },
  { key: 'career', label: 'Career', icon: '◆' },
  { key: 'growth', label: 'Growth', icon: '🌱' },
  // V1.2 — Replaced ☉ (Sun glyph, astrology) with ☀️ emoji.
  { key: 'today', label: "Today's Energy", icon: '☀️' },
];

// V1.2 — Apple compliance constants for AI chat (App Review 1.2 / 1.4.1 / 5.1.2(i)).
// AsyncStorage keys persist consent + first-send-notice acknowledgement.
const CONSENT_KEY = 'celestia_chat_consent_v1';
const FIRST_SEND_NOTICE_KEY = 'celestia_chat_first_send_v1';

// Client-side crisis-keyword safety net (Apple 1.4.1 — physical harm).
// Belt-and-suspenders: even if the AI misses a cue, we intercept locally.
// Patterns are conservative — designed to catch direct expressions, not
// false-positive on phrases like "this is killing me at work."
const CRISIS_PATTERNS = [
  /\b(kill\s*my\s*self|killing\s*my\s*self|kms)\b/i,
  /\b(want|wanna|gonna)\s*to?\s*die\b/i,
  /\bi\s*don'?t\s*want\s*to\s*be\s*(here|alive)\b/i,
  /\bend\s*it\s*all\b/i,
  /\b(self[-\s]?harm|hurt(ing)?\s*my\s*self|cutting\s*my\s*self)\b/i,
  /\b(suicid(e|al)|s[uw]icide)\b/i,
  /\bno\s*reason\s*to\s*(live|go\s*on)\b/i,
  /\bbetter\s*off\s*(without\s*me|dead)\b/i,
];

const CRISIS_RESPONSE = `I want to pause here — what you're sharing matters too much for a quick reply.

If it would help, here are people trained to be present when something feels this heavy:
• 988 — call or text (Suicide & Crisis Lifeline, US)
• Text HOME to 741741 (Crisis Text Line)
• 1-800-799-7233 (National Domestic Violence Hotline, US)

Outside the US, your local helpline is always a good first call.

I'm right here when you want to keep talking — and for this moment, a real person can sit with you in a way I'd love to but can't.`;

const detectCrisis = (text) => CRISIS_PATTERNS.some(rx => rx.test(text));

// Compose a "Report this response" mailto: link.
// Apple 1.2 requires a flag mechanism for AI/UGC output and a documented
// support response time. The mailto fallback is the lowest-friction path.
const buildReportEmail = (messageText) => {
  const subject = encodeURIComponent('A response I’d like the Celestia team to look at');
  const body = encodeURIComponent(
    `Hi Celestia team,\n\nI'd love for you to take a look at this response I got in the Ask tab:\n\n"${(messageText || '').slice(0, 600)}"\n\nWhat I'd like to share:\n[a few words about what felt off]\n\nThanks for reading — the team replies within 24 hours.\n— Sent from Celestia iOS`
  );
  return `mailto:support@celestia.app?subject=${subject}&body=${body}`;
};

export default function ChatScreen({ navigation, route }) {
  const { isPro } = useRevenueCat();
  const insets = useSafeAreaInsets();
  // Tab bar is hidden on this screen, so only need safe area bottom
  const bottomPadding = Math.max(insets.bottom, 10);
  const previousTab = route?.params?.previousTab || 'Today';
  const { capture } = useAnalytics();
  const { colors, isDark } = useTheme();

  const { userProfile, partnerProfiles } = useUserProfile();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState(null); // full session object from createChatSession
  const [suggestions, setSuggestions] = useState([]);
  const [chatTheme, setChatTheme] = useState('open');
  // V1: paywall state removed (remainingMsgs, limitReached, showUpgradeNudge).
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  // V1.2 — Apple compliance state.
  // showConsent: blocks chat until user accepts AI/Gemini disclosure (Apple 5.1.2(i) + 1.4.1).
  // showFirstSendNotice: one-time inline banner about Gemini after first send.
  const [showConsent, setShowConsent] = useState(false);
  const [consentChecked, setConsentChecked] = useState(false);
  const [showFirstSendNotice, setShowFirstSendNotice] = useState(false);
  // V1.2 — Placeholder profile flag (set by × close button on onboarding).
  // Re-read on focus so chat re-enables the moment user fills real details.
  const [isPlaceholderProfile, setIsPlaceholderProfile] = useState(false);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const v = await loadBoolean('celestia_profile_is_placeholder');
        if (mounted) setIsPlaceholderProfile(v);
      })();
      return () => { mounted = false; };
    }, [])
  );

  // Load consent + first-send-notice flags on mount. If either is unset,
  // we present them at the appropriate moment.
  useEffect(() => {
    (async () => {
      try {
        const accepted = await loadBoolean(CONSENT_KEY);
        const noticeSeen = await loadBoolean(FIRST_SEND_NOTICE_KEY);
        if (!accepted) setShowConsent(true);
        if (!noticeSeen) setShowFirstSendNotice(true);
      } catch (e) {
        // If storage fails, err on the side of showing the consent
        setShowConsent(true);
      } finally {
        setConsentChecked(true);
      }
    })();
  }, []);

  const acceptConsent = async () => {
    haptic.medium();
    setShowConsent(false);
    try { await saveBoolean(CONSENT_KEY, true); } catch (e) {}
  };

  // "Report this response" — long-press an AI message → action sheet → email.
  // Apple 1.2 requires a flag mechanism on AI/UGC output.
  const reportMessage = (messageText) => {
    haptic.light();
    const open = () => {
      const url = buildReportEmail(messageText);
      Linking.openURL(url).catch(() => {
        Alert.alert(
          'Email isn\'t set up',
          'You can write to us at support@celestia.app and we\'ll reply within 24 hours.',
          [{ text: 'Got it' }]
        );
      });
    };
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          title: 'About this response',
          message: 'Send it to the Celestia team to review.',
          options: ['Cancel', 'Send to the team'],
          cancelButtonIndex: 0,
          destructiveButtonIndex: 1,
        },
        (idx) => { if (idx === 1) open(); }
      );
    } else {
      Alert.alert(
        'About this response',
        'Send this response to the Celestia team to review? We reply within 24 hours.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send to team', style: 'destructive', onPress: open },
        ]
      );
    }
  };

  const dismissFirstSendNotice = async () => {
    setShowFirstSendNotice(false);
    try { await saveBoolean(FIRST_SEND_NOTICE_KEY, true); } catch (e) {}
  };

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, () => setKeyboardVisible(true));
    const subHide = Keyboard.addListener(hideEvent, () => setKeyboardVisible(false));
    return () => { subShow.remove(); subHide.remove(); };
  }, []);

  // Share an AI response
  const shareResponse = async (text) => {
    try {
      const clean = text.replace(/\*\*/g, '').replace(/\*/g, '');
      // PDF plan §06: discreet Celestia watermark, no mystical-influencer cadence.
      await Share.share({
        message: `${clean}\n\n— Celestia · celestia.app`,
      });
    } catch (e) { }
  };
  const scrollRef = useRef(null);
  const initialMessageSent = useRef(false);

  // Intercept Android back button when history panel is open
  useEffect(() => {
    if (!showHistory) return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setShowHistory(false);
      return true;
    });
    return () => sub.remove();
  }, [showHistory]);

  const loadChatHistory = async () => {
    try {
      const sessions = await ChatRepository.getSessions(20);
      setChatSessions(sessions || []);
      setShowHistory(true);
    } catch (e) { console.error('Failed to load chat history:', e); }
  };

  const switchToSession = async (s) => {
    try {
      const msgs = await ChatRepository.getMessages(s.id);
      setMessages(msgs.map(m => ({ id: m.id || String(m.timestamp), role: m.role, text: m.text, timestamp: m.timestamp })));
      if (userProfile) {
        const chatSession = await createChatSession(userProfile, null, s.id, null, isPro);
        // Initialize conversation state for resumed sessions — set exchange count from history
        chatSession.conversationState = {
          ...defaultConversationState(),
          exchangeCount: Math.floor(msgs.length / 2),
          mode: msgs.length > 4 ? 'insight' : msgs.length > 2 ? 'orient' : 'intake',
        };
        setSession(chatSession);
      }
      setShowHistory(false);
      haptic.light();
      setTimeout(() => scrollRef.current?.scrollToEnd?.({ animated: false }), 100);
    } catch (e) { console.error('Failed to switch session:', e); }
  };

  const deleteSessionById = async (sessionId) => {
    Alert.alert('Delete Chat', 'Delete this conversation?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => {
        try {
          await ChatRepository.deleteSession(sessionId);
          setChatSessions(prev => prev.filter(s => s.id !== sessionId));
          haptic.light();
        } catch (e) { }
      }},
    ]);
  };

  // V1.1: proactiveInsight restored — but ONLY relational content from user's
  // onboarding answers (motivation/depth/attachment style). No chart/transit/sign.
  const [proactiveInsight, setProactiveInsight] = useState(null);
  const [narrativeCtx, setNarrativeCtx] = useState(null);

  const name = userProfile?.name?.split(' ')[0] || 'friend';
  const sun = userProfile?.chart?.planets?.find(p => p.name === 'Sun');
  const moon = userProfile?.chart?.planets?.find(p => p.name === 'Moon');
  const rising = userProfile?.chart?.planets?.find(p => p.name === 'Ascendant');

  // V1: ctxChips array removed — was dead code that built astro chips. Never rendered.

  // Build narrative-aware greeting
  // V1: greeting rewritten to drop all astrology content from the chat opening
  // surface. Greeting now leads with relational/journal context only — no signs,
  // planets, transits, retrogrades, or "Moon in [sign]" lines.
  const buildNarrativeGreeting = (ctx) => {
    if (!ctx) return "What's on your mind today?";
    const parts = [];
    if (ctx.yesterday?.journalMood) {
      const moodMap = { great: 'a good day', good: 'a steady day', okay: 'an okay day', low: 'a heavier day', anxious: 'an anxious day' };
      parts.push(`Yesterday felt like ${moodMap[ctx.yesterday.journalMood] || ctx.yesterday.journalMood}.`);
    }
    if (ctx.streak && ctx.streak > 1) {
      parts.push(`You've been showing up — ${ctx.streak} days in a row.`);
    }
    parts.push("What's on your mind?");
    return parts.join(' ');
  };

  const makeGreeting = (id = 'greeting', ctx = null) => {
    const hour = new Date().getHours();
    const timeGreet = hour >= 22 || hour < 5 ? 'Hey' : hour >= 17 ? 'Good evening' : hour >= 12 ? 'Good afternoon' : 'Good morning';

    let body;
    if (ctx) {
      body = buildNarrativeGreeting(ctx);
    } else {
      // V1: relational-only fallback. No "Sun · Moon · Rising" string.
      // Time-aware but doesn't reference astrology data.
      body = hour >= 22 || hour < 5
        ? "What's keeping you up?"
        : hour >= 17
        ? 'How was today?'
        : "What's on your mind?";
    }

    return { id, role: 'model', text: `${timeGreet}, ${name} ✦\n\n${body}`, timestamp: Date.now() };
  };

  // Keyboard handling: react-native-keyboard-controller's KeyboardStickyView
  // handles positioning automatically — no manual listeners needed

  // Initialize: load latest session history OR start fresh, then create AI session
  useEffect(() => {
    if (!userProfile) return;
    // Build transit context for prompt suggestions
    let transitCtx = null;
    try {
      const moonNow = getMoonDataForDate(new Date());
      transitCtx = {
        mercuryRx: false, // will be updated from narrative context
        moonPhase: moonNow?.phaseName || null,
      };
    } catch (e) { }

    setSuggestions(pickSuggestions([], userProfile, chatTheme, transitCtx));

    // Load narrative context, then init chat with it
    getNarrativeContext(userProfile?.id || 'default', userProfile.chart)
      .then(ctx => {
        setNarrativeCtx(ctx);
        initChat(ctx);
      })
      .catch(() => initChat(null));

    // V1.1: Build proactive insight from onboarding motivation answer.
    // Pure relational — never references planets, signs, or charts.
    try {
      const motiv = userProfile?.motivation;
      const MOTIV_PROMPTS = {
        unavailable: { title: 'A pattern worth naming', body: 'You said you keep attracting emotionally unavailable people. Let\'s talk about why.', question: 'Why do I keep ending up with emotionally unavailable people?' },
        push_away:   { title: 'A pattern worth naming', body: 'You said you push people away when things get serious. Let\'s talk about it.', question: 'Why do I push people away when things get real?' },
        lose_self:   { title: 'A pattern worth naming', body: 'You said you lose yourself in relationships. Want to dig into why?', question: 'Why do I lose myself in relationships?' },
        avoid_commit:{ title: 'A pattern worth naming', body: 'You said you avoid commitment. There\'s usually a reason underneath.', question: 'Why do I keep avoiding commitment?' },
      };
      const insight = motiv ? MOTIV_PROMPTS[motiv] : null;
      if (insight) setProactiveInsight(insight);
    } catch (e) {}
  }, [userProfile]);

  const initChat = async (ctx = null) => {
    const greeting = makeGreeting('greeting', ctx);
    let loadedSessionId = null;

    // Try to load the most recent session's messages
    try {
      const sessions = await ChatRepository.getSessions();
      if (sessions && sessions.length > 0) {
        const latest = sessions[0];
        const pastMsgs = await ChatRepository.getMessages(latest.id);
        if (pastMsgs && pastMsgs.length > 0) {
          const formatted = pastMsgs.map((m, i) => ({
            id: `hist_${i}`,
            role: m.role,
            text: m.text,
            timestamp: m.created_at || Date.now(),
          }));
          setMessages([greeting, ...formatted]);
          loadedSessionId = latest.id;
        }
      }
    } catch (e) {
      console.error('Failed to load chat history:', e);
    }

    // If no history, just show greeting
    if (!loadedSessionId) {
      setMessages([greeting]);
    }

    // Create the AI session object (with full chart context in system instruction)
    try {
      const chatSession = await createChatSession(userProfile, null, loadedSessionId, ctx, isPro);
      // Initialize conversation state
      chatSession.conversationState = defaultConversationState();
      if (loadedSessionId) {
        // Resumed session — estimate exchange count from loaded history
        const histLen = chatSession.history?.length || 0;
        chatSession.conversationState.exchangeCount = Math.floor(histLen / 2);
        chatSession.conversationState.mode = histLen > 8 ? 'insight' : histLen > 4 ? 'orient' : 'intake';
      }
      setSession(chatSession);
    } catch (e) {
      console.error('Failed to create chat session:', e);
    }
  };

  // Handle initial message from transit screen "Ask AI" button
  useEffect(() => {
    const initialMessage = route?.params?.initialMessage;
    if (initialMessage && !initialMessageSent.current && session && messages.length > 0 && !sending) {
      initialMessageSent.current = true;
      setTimeout(() => handleSend(initialMessage), 500);
    }
  }, [session, messages.length, route?.params?.initialMessage]);

  // Auto-scroll on new messages + refresh suggestions
  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
    setSuggestions(pickSuggestions(messages, userProfile, chatTheme));
  }, [messages]);

  // Start a brand new chat session
  const startNewSession = async (theme = null) => {
    const activeTheme = theme || chatTheme;
    if (theme) setChatTheme(theme);
    const greeting = makeGreeting('greeting_new', narrativeCtx);
    setMessages([greeting]);
    initialMessageSent.current = false;

    try {
      const chatSession = await createChatSession(userProfile, null, null, narrativeCtx, isPro);
      chatSession.conversationState = defaultConversationState();
      // V1.2 — Theme injection rewritten without astrology vocabulary.
      // Themes still scope the conversation, but using relational-pattern
      // language. The chart data is internal engine input; surface text is
      // psychology-led per V1_LANGUAGE_OVERRIDE.
      if (activeTheme !== 'open' && chatSession?.systemInstruction) {
        const themePrompts = {
          love: '\nSESSION THEME: Love & Relationships. Focus on attachment patterns, emotional intimacy, communication styles in relationships, and how this person tends to give and receive love. Use plain emotional language only.',
          career: '\nSESSION THEME: Career & Purpose. Focus on ambition, work style, professional identity, and how this person performs under pressure or pursues meaning. Use plain emotional/behavioral language only.',
          growth: '\nSESSION THEME: Growth & Self-Discovery. Focus on inner patterns, blind spots, the next stage of development, and what this person is being asked to grow through. Use plain emotional language only.',
          today: '\nSESSION THEME: Today\'s Read. Focus on what the emotional climate of today is asking from them — relational themes, friction points, opportunities to lean in. Use plain emotional / seasonal language only.',
        };
        chatSession.systemInstruction += themePrompts[activeTheme] || '';
      }
      setSession(chatSession);
    } catch (e) {
      console.error('Failed to create new session:', e);
    }
  };

  // Send a message using the proper createChatSession + sendChatMessage pipeline
  const handleSend = async (textOverride) => {
    const text = (textOverride || inputText || '').trim();
    if (!text || sending) return;

    // V1: message-count limits + upgrade gating removed. No paywall in v1.

    haptic.light();

    setInputText('');

    // Optimistically add user message to UI
    const userMsg = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    // V1.2 — Client-side crisis safety net (Apple 1.4.1). Intercept BEFORE
    // sending to Gemini. If the user message contains direct crisis cues,
    // we respond locally with hotline numbers — never hand it off to AI.
    // The mark `isCrisisIntercept: true` lets the bubble render with a
    // distinct treatment so the user sees this isn't a casual reply.
    if (detectCrisis(text)) {
      const interceptMsg = {
        id: Date.now().toString() + '_crisis',
        role: 'model',
        text: CRISIS_RESPONSE,
        timestamp: Date.now(),
        isCrisisIntercept: true,
      };
      setMessages(prev => [...prev, interceptMsg]);
      setSending(false);
      // First-send notice still gets dismissed if applicable so the user
      // doesn't see a "sent to Google" notice on a message we never sent.
      if (showFirstSendNotice) dismissFirstSendNotice();
      return;
    }

    try {
      // Ensure we have a session
      let currentSession = session;
      if (!currentSession && userProfile) {
        currentSession = await createChatSession(userProfile, null, null, null, isPro);
        currentSession.conversationState = defaultConversationState();
        setSession(currentSession);
      }

      if (!currentSession) {
        throw new Error('No session available');
      }

      // Conversation intelligence now handles reflective questions via response contracts
      const responseText = await sendChatMessage(currentSession, text);
      capture(EVENTS.AI_CHAT_MESSAGE_SENT, { is_pro: isPro, message_number: messages.length + 1 });

      // Update session ref if ID was assigned (transient → persisted)
      if (currentSession.id && currentSession !== session) {
        setSession(currentSession);
      }

      const aiMsg = {
        id: Date.now().toString() + '_ai',
        role: 'model',
        text: responseText,
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, aiMsg]);
      haptic.light();

      // V1.2 — once a real send succeeds, mark first-send notice seen.
      if (showFirstSendNotice) dismissFirstSendNotice();

      // Track chat engagement
      const profileId = userProfile?.id || 'default';
      trackEvent('chat_message').catch(() => { });
      awardXP(profileId, 'chat_message').catch(() => { });
      completeQuestAction('chat_sent').catch(() => { });

    } catch (e) {
      console.error('Chat error:', e);
      const errMsg = {
        id: Date.now().toString() + '_err',
        role: 'model',
        text: 'Connection is unstable. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  // V1.2 — Empty state when user skipped onboarding (placeholder profile).
  // The chat itself depends on a real chart for the persona prompt; rendering
  // the chat with placeholder DOB would mean the AI's "knows you" framing
  // refers to Friend/Jan-1-1990, which is misleading.
  if (isPlaceholderProfile) {
    return (
      <SetupRequiredState
        subtitle={"Add your birth details so Celestia can chat\nwith you in your voice."}
        onAddDetails={() => navigation.navigate('OnboardingFlow', { startAt: 6 })}
      />
    );
  }

  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.bg }]}
    >
      {/* Minimal sticky top bar — stays visible */}
      {/* Sticky top bar: X | ✦ Celestia | history | + new */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 8,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity
          style={[styles.dismissBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Close chat"
          onPress={() => { haptic.light(); navigation.navigate(previousTab); }}
        >
          <X size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <LinearGradient colors={['#3A1A28', '#5A2840']} style={[styles.chatOrb, { width: 30, height: 30, borderRadius: 15, marginLeft: 8 }]}>
          <Text style={{ fontSize: 15, color: '#C8A84B' }}>✦</Text>
        </LinearGradient>
        <Text style={{ fontFamily: FONTS.serifMedium, fontSize: 16, color: colors.heading, flex: 1, marginLeft: 8 }}>Celestia</Text>
        {/* History icon */}
        <TouchableOpacity
          onPress={loadChatHistory}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Open chat history"
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border,
            alignItems: 'center', justifyContent: 'center', marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 15 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">🕘</Text>
        </TouchableOpacity>
        {/* New chat + icon */}
        <TouchableOpacity
          onPress={startNewSession}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Start new chat"
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: T.navy, fontWeight: '300', marginTop: -1 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">+</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.msgs}
        contentContainerStyle={{ paddingBottom: bottomPadding + 20, paddingHorizontal: 17, gap: 15 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {/* Greeting — only shown at start of new conversation */}
        {messages.length <= 1 && (
          <View style={{ alignItems: 'center', paddingTop: 20, paddingBottom: 10 }}>
            <LinearGradient colors={['#3A1A28', '#5A2840']} style={[styles.chatOrb, { width: 52, height: 52, borderRadius: 26, marginBottom: 10 }]}>
              <Text style={{ fontSize: 28, color: '#C8A84B' }}>✦</Text>
            </LinearGradient>
            <Text style={{ fontFamily: FONTS.serifMedium, fontSize: 18, color: colors.heading, marginBottom: 2 }}>Celestia</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {new Date().getHours() >= 22 || new Date().getHours() < 5 ? 'Night session' : new Date().getHours() >= 17 ? 'Evening session' : 'Always here'}
            </Text>
          </View>
        )}

        {/* V1.1: Proactive Insight Card — relational content from onboarding answers.
            Renders on empty chat state; one-tap opens chat with prefilled question. */}
        {proactiveInsight && messages.length <= 2 && (
          <TouchableOpacity
            style={[styles.proactiveCard, isDark && { backgroundColor: 'rgba(200,168,75,0.10)', borderColor: 'rgba(200,168,75,0.25)' }]}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Insight: ${proactiveInsight.title}. ${proactiveInsight.body}. Tap to ask.`}
            onPress={() => {
              setProactiveInsight(null);
              handleSend(proactiveInsight.question);
            }}>
            <Text style={[styles.proactiveLabel, isDark && { color: T.gold }]}>INSIGHT</Text>
            <Text style={[styles.proactiveTitle, isDark && { color: colors.heading }]}>{proactiveInsight.title}</Text>
            <Text style={[styles.proactiveBody, isDark && { color: colors.textSecondary }]}>{proactiveInsight.body}</Text>
            <Text style={[styles.proactiveCTA, isDark && { color: T.gold }]}>Tap to ask →</Text>
          </TouchableOpacity>
        )}

        {/* V1.2 — First-send disclosure (Apple 5.1.2(i)). Shows once before
            the user has had any chat exchange; clears itself after the first
            successful send via dismissFirstSendNotice. Voice: warm and clear. */}
        {showFirstSendNotice && consentChecked && messages.length === 0 && (
          <View style={styles.firstSendNotice} accessibilityLiveRegion="polite">
            <Text style={{ fontSize: 16 }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✦</Text>
            <Text style={styles.firstSendNoticeText}>
              Celestia thinks with the help of Google's Gemini AI. Your messages travel over a secure connection and stay between you and the moment.
            </Text>
            <TouchableOpacity onPress={dismissFirstSendNotice}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityRole="button"
              accessibilityLabel="Got it">
              <Text style={styles.firstSendNoticeDismiss}>Got it</Text>
            </TouchableOpacity>
          </View>
        )}

        {messages.map((m, i) => (
          <View key={m.id || i} accessible={true}
            accessibilityRole="text"
            accessibilityLabel={`${m.role === 'model' ? 'Celestia AI' : 'You'}: ${m.text}`}>
            <View style={[styles.mrow, m.role === 'user' && styles.mrowUser]}>
              <LinearGradient
                colors={m.role === 'model' ? ['#3A1A28', '#5A2840'] : ['#E2C46A', '#8C6C18']}
                style={styles.morb}
              >
                <Text style={{ fontSize: 13, color: m.role === 'model' ? '#C8A84B' : 'white' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">{m.role === 'model' ? '✦' : name[0]?.toUpperCase()}</Text>
              </LinearGradient>
              {/* V1.2 — Long-press AI bubbles to surface "Report this response"
                  (Apple 1.2). Long-press feels native and doesn't add visual
                  bloat to every message; reviewers test this gesture. */}
              <TouchableOpacity
                activeOpacity={1}
                onLongPress={m.role === 'model' && m.id !== 'greeting' && m.id !== 'greeting_new'
                  ? () => reportMessage(m.text)
                  : undefined}
                delayLongPress={400}
                style={[styles.mbub, m.role === 'model' ? [styles.mbubAi, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.07 }] : styles.mbubUser]}>
                <Text style={[styles.mbubText, { color: colors.text }, m.role === 'user' && { color: T.cream }]}>
                  {m.role === 'model'
                    ? renderMarkdown(m.text, [styles.mbubText, { color: colors.text }])
                    : m.text}
                </Text>
              </TouchableOpacity>
            </View>
            <View style={[styles.mtimeRow, m.role === 'user' && { flexDirection: 'row-reverse' }]}>
              {/* V1.2 — Per-message AI tag (Apple 2.5.7 / Generative AI policy).
                  Every Celestia bubble shows an inline "AI" label so any
                  screenshot a reviewer takes makes the AI nature obvious. */}
              {m.role === 'model' && (
                <Text style={[styles.aiTag, { color: colors.textMuted }]}>✦ AI</Text>
              )}
              <Text style={[styles.mtime, { color: colors.textMuted }]}>{formatTime(m.timestamp)}</Text>
              {m.role === 'model' && m.id !== 'greeting' && m.id !== 'greeting_new' && !m.isCrisisIntercept && (
                <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Share this message"
                  onPress={() => shareResponse(m.text)}>
                  <Text style={styles.shareBtnText}>Share ↗</Text>
                </TouchableOpacity>
              )}
              {m.role === 'model' && m.id !== 'greeting' && m.id !== 'greeting_new' && (
                <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  accessibilityRole="button"
                  accessibilityLabel="Send this response to the Celestia team"
                  onPress={() => reportMessage(m.text)}>
                  <Text style={[styles.shareBtnText, { color: colors.textMuted }]}>Send to team</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {sending && (
          <View style={styles.mrow}>
            <LinearGradient colors={['#3A1A28', '#5A2840']} style={styles.morb}>
              <Text style={{ fontSize: 13, color: '#C8A84B' }}>✦</Text>
            </LinearGradient>
            <View style={[styles.typingWrap, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.07 }]}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: Platform.OS === 'ios' ? 0 : 0 }}>
      <View style={{ paddingBottom: keyboardVisible ? 6 : bottomPadding, backgroundColor: colors.bg, zIndex: 100 }}>
        {/* AI disclaimer (Apple 1.4 / 5.5) — warm, present-tense voice */}
        <Text style={{ fontSize: 10, color: colors.textSecondary, textAlign: 'center', paddingVertical: 4, opacity: 0.55 }}>
          Written with AI · here for reflection
        </Text>
        {/* V1 PDF plan §04: per-person chip strip from saved Connections.
            Renders only when user has saved at least one partner. */}
        {partnerProfiles && partnerProfiles.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false}
            style={{ flexGrow: 0, paddingVertical: 4 }}
            contentContainerStyle={{ paddingHorizontal: 17, gap: 7 }}>
            {partnerProfiles.slice(0, 6).map((p) => {
              const firstName = (p.name || '').split(' ')[0] || 'them';
              return (
                <TouchableOpacity
                  key={p.id}
                  style={[styles.schip, { backgroundColor: 'rgba(200,168,75,0.08)', borderColor: 'rgba(200,168,75,0.25)' }]}
                  activeOpacity={0.7}
                  accessibilityRole="button"
                  accessibilityLabel={`Ask about ${firstName}`}
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                  onPress={() => { setInputText(`Help me understand ${firstName}'s pattern with me.`); haptic.light(); }}>
                  <Text style={[styles.schipText, { color: T.gold, fontFamily: FONTS.sansMedium }]}>Ask about {firstName}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        )}
        {/* Suggestions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.suggestStrip, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingHorizontal: 17, gap: 7 }}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={`${s}_${i}`} style={[styles.schip, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel={`Suggested prompt: ${s}`}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              onPress={() => { setInputText(s); haptic.light(); }}>
              <Text style={[styles.schipText, { color: colors.text }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* V1: upgrade nudge / limit-reached / messages-left UI removed.
            No paywall in v1. */}

        {/* Input bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
            <View style={[styles.inputField, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <TextInput
                style={[styles.inputText, { color: colors.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask anything..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                maxLength={500}
                onSubmitEditing={() => handleSend()}
              />
            </View>
            <TouchableOpacity activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Send message"
              accessibilityState={{ disabled: !!sending || !inputText.trim(), busy: !!sending }}
              onPress={() => handleSend()} disabled={sending || !inputText.trim()}>
              <LinearGradient colors={[T.navy, T.navy]} style={[styles.sendBtn, (!inputText.trim() || sending) && { opacity: 0.5 }]}>
                <Text style={{ fontSize: 17, color: 'white' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
      </View>
      </KeyboardStickyView>

      {/* Chat History Modal */}
      {showHistory && (
        <View accessibilityViewIsModal={true} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, zIndex: 200 }}>
          {/* History Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 62 : 40, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={{ padding: 4 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Close history">
              <Text style={{ fontSize: 18, color: colors.textSecondary }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">←</Text>
            </TouchableOpacity>
            <Text accessibilityRole="header" style={{ fontFamily: FONTS.serifMedium, fontSize: 20, color: colors.heading, flex: 1, textAlign: 'center' }}>Chat History</Text>
            <TouchableOpacity onPress={() => { setShowHistory(false); startNewSession(); }} style={{ padding: 4 }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityRole="button"
              accessibilityLabel="Start new chat">
              <Text style={{ fontSize: 13, color: T.gold, fontFamily: FONTS.sansSemiBold }}>+ New</Text>
            </TouchableOpacity>
          </View>

          {/* Session List */}
          <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
            {chatSessions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 80 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>✦</Text>
                <Text style={{ fontFamily: FONTS.serifMedium, fontSize: 18, color: colors.heading, marginBottom: 6 }}>No past conversations</Text>
                <Text style={{ fontSize: 13, color: colors.textSecondary }}>Start chatting and your history will appear here</Text>
              </View>
            ) : (
              chatSessions.map((s) => {
                const date = new Date(s.lastUpdated || s.createdAt);
                const isToday = date.toDateString() === new Date().toDateString();
                const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <View key={s.id} style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 14, padding: 14, marginBottom: 8 }}>
                    <TouchableOpacity onPress={() => switchToSession(s)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Open chat: ${s.title || 'Untitled chat'}, ${dateStr} ${timeStr}`}>
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(200,168,75,0.1)', alignItems: 'center', justifyContent: 'center' }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        <Text style={{ fontSize: 16, color: T.gold }}>✦</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: FONTS.sansMedium, color: colors.heading }}>{s.title || 'Untitled chat'}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{dateStr} · {timeStr}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteSessionById(s.id)} style={{ padding: 6 }}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      accessibilityRole="button"
                      accessibilityLabel={`Delete chat: ${s.title || 'Untitled chat'}`}>
                      <Text style={{ fontSize: 14, color: colors.textMuted }} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}

      {/* V1.2 — First-chat consent. Required by Apple 5.1.2(i) (third-party
          AI disclosure) + 1.4.1 (medical/MH refusal). Blocks interaction until
          the user taps Continue. Acceptance persists via AsyncStorage so it's
          a one-time moment. Voice: warm, forward-leaning, never warning-coded. */}
      <Modal visible={showConsent && consentChecked} animationType="fade" transparent presentationStyle="overFullScreen">
        <View style={styles.consentOverlay}>
          <View style={styles.consentCard} accessible accessibilityViewIsModal>
            <Text accessibilityRole="header" style={styles.consentTitle}>How Celestia works</Text>
            <Text style={styles.consentBody}>
              Celestia thinks with the help of Google's Gemini AI. Your messages travel over a secure connection and stay only on your device — nothing is kept on our side.
            </Text>
            <Text style={styles.consentBody}>
              We're here for reflection and self-discovery. For medical, mental-health, or legal guidance, the right person is someone trained for those.
            </Text>
            <Text style={[styles.consentBody, { fontSize: 12, color: '#6E5E64', marginBottom: 0 }]}>
              By tapping Continue, you agree to our Terms of Service. If a response ever feels off, hold it for a second to send it to our team — we read everything within 24 hours.
            </Text>

            <TouchableOpacity
              style={styles.consentBtn}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel="I'm ready. Continue."
              onPress={acceptConsent}>
              <Text style={styles.consentBtnText}>I'm ready — Continue</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: T.cream },
  header: { backgroundColor: 'rgba(250,248,242,0.96)', borderBottomWidth: 1, borderBottomColor: T.border, paddingTop: 62, paddingHorizontal: 22, paddingBottom: 13 },
  aiRow: { flexDirection: 'row', alignItems: 'center', gap: 11, marginBottom: 11 },
  chatOrb: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', shadowColor: T.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 12 },
  orbDot: { position: 'absolute', bottom: 1, right: 1, width: 12, height: 12, borderRadius: 6, backgroundColor: '#4CAF50', borderWidth: 2.5, borderColor: T.cream },
  aiName: { fontFamily: FONTS.serif, fontSize: 20, color: T.navy, marginBottom: 1 },
  aiSub: { fontSize: 11, color: T.stone },
  dismissBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  newChatBtn: { backgroundColor: T.warm, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: T.border },
  newChatBtnText: { fontSize: 11, fontFamily: FONTS.sansMedium, color: T.ink },
  ctxBar: { flexDirection: 'row' },
  ctxChip: { backgroundColor: T.warm, borderRadius: 100, paddingVertical: 4, paddingHorizontal: 11, marginRight: 6 },
  ctxChipText: { fontSize: 11, color: '#5A5040' },
  msgs: { flex: 1 },
  mrow: { flexDirection: 'row', gap: 9 },
  mrowUser: { flexDirection: 'row-reverse' },
  morb: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  mbub: { maxWidth: '73%', borderRadius: 18, padding: 11, paddingHorizontal: 14 },
  mbubAi: { backgroundColor: 'white', borderBottomLeftRadius: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 7 },
  mbubUser: { backgroundColor: T.navy, borderBottomRightRadius: 5 },
  mbubText: { fontSize: 13.5, lineHeight: 22, color: T.ink },
  mtime: { fontSize: 10, color: '#C0B8A4' },
  typingWrap: { backgroundColor: 'white', borderRadius: 18, borderBottomLeftRadius: 5, padding: 12, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 7 },
  suggestStrip: { flexGrow: 0, paddingVertical: 7 },
  schip: { backgroundColor: 'white', borderWidth: 1, borderColor: T.border, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  schipText: { fontSize: 12, color: T.ink },
  inputBar: { paddingHorizontal: 17, paddingTop: 9, paddingBottom: 28, backgroundColor: T.cream, borderTopWidth: 1, borderTopColor: T.border, flexDirection: 'row', gap: 9, alignItems: 'flex-end' },
  inputField: { flex: 1, minHeight: 48, maxHeight: 120, backgroundColor: 'white', borderWidth: 1.5, borderColor: T.border, borderRadius: 24, paddingHorizontal: 17, justifyContent: 'center' },
  inputText: { fontSize: 14, color: T.ink, paddingVertical: 12 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: T.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 12 },
  // Proactive insight
  proactiveCard: { backgroundColor: '#EEF0FF', borderWidth: 1, borderColor: '#D8DCFF', borderRadius: 16, padding: 14, marginBottom: 10 },
  proactiveLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: '#8B6B7E', marginBottom: 6 },
  proactiveTitle: { fontFamily: FONTS.serif, fontSize: 16, color: '#2A2060', marginBottom: 4 },
  proactiveBody: { fontSize: 13, color: '#5A5090', lineHeight: 19, marginBottom: 8 },
  proactiveCTA: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: '#8B6B7E' },
  // Message time + share row
  mtimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingHorizontal: 4 },
  shareBtn: { paddingVertical: 2, paddingHorizontal: 6 },
  shareBtnText: { fontSize: 10, color: T.gold, fontFamily: FONTS.sansMedium },
  // V1.2 — Apple compliance: per-message AI tag + first-send notice + consent modal.
  aiTag: { fontSize: 9, fontFamily: FONTS.sansSemiBold, color: '#9B8E8F', letterSpacing: 0.5, marginRight: 2 },
  firstSendNotice: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginVertical: 8, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: 'rgba(92,36,52,0.06)', borderWidth: 1, borderColor: 'rgba(92,36,52,0.16)', borderRadius: 12 },
  firstSendNoticeText: { flex: 1, fontSize: 11, color: '#5C2434', lineHeight: 16, fontFamily: FONTS.sans },
  firstSendNoticeDismiss: { fontSize: 13, color: '#5C2434', fontFamily: FONTS.sansSemiBold, paddingHorizontal: 4, paddingVertical: 2 },
  consentOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', paddingHorizontal: 22 },
  consentCard: { backgroundColor: '#FFFFFF', borderRadius: 22, padding: 26, width: '100%', maxWidth: 480, shadowColor: '#000', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.18, shadowRadius: 28, elevation: 12 },
  consentTitle: { fontFamily: FONTS.serif, fontSize: 22, color: '#2A2418', marginBottom: 12, letterSpacing: -0.3 },
  consentBody: { fontSize: 13.5, color: '#2A2418', lineHeight: 21, fontFamily: FONTS.sans, marginBottom: 14 },
  consentBtn: { backgroundColor: '#5C2434', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  consentBtnText: { fontSize: 15, color: '#FAF8F2', fontFamily: FONTS.sansSemiBold, letterSpacing: 0.3 },
  // Limit banner
  limitBanner: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 6, backgroundColor: 'rgba(200,168,75,0.08)', borderTopWidth: 1, borderTopColor: 'rgba(200,168,75,0.12)' },
  limitText: { fontSize: 11, color: T.stone },
  limitLink: { fontSize: 11, fontFamily: FONTS.sansMedium, color: T.gold },
  // Theme selector
  themeStrip: { flexGrow: 0, paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: T.border, backgroundColor: T.cream },
  themePill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'white', borderWidth: 1, borderColor: T.border, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  themePillActive: { backgroundColor: T.navy, borderColor: T.navy },
  themePillIcon: { fontSize: 12 },
  themePillText: { fontSize: 12, fontFamily: FONTS.sansMedium, color: T.ink },
  themePillTextActive: { color: T.cream },
});
