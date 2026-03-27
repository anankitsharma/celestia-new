import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Platform, ActivityIndicator, Keyboard, Share, Alert, BackHandler
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
import { haptic } from '../services/hapticService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';
import { completeQuestAction } from '../services/questService';
import { getActiveCosmicWindows, getMoonDataForDate } from '../services/astrologyService';
import { getNarrativeContext } from '../services/narrativeService';
import { useRevenueCat } from '../contexts/RevenueCatContext';
import { useNavigation } from '@react-navigation/native';
import { useAnalytics, EVENTS } from '../services/analytics';
import { X } from 'lucide-react-native';


// ── DYNAMIC SUGGESTION QUESTIONS ─────────────────────────────
// Natural questions a real astrology user would ask, grouped by topic.
// Rotates based on conversation context.

const Q_INITIAL = [
  // Love & relationships (most common astrology queries)
  "Why do I keep dating the same type of person?",
  "What does my chart say about my love life?",
  "Am I compatible with a {randomSign}?",
  "Why is it so hard for me to open up emotionally?",
  "What kind of partner is actually right for me?",
  // Self & identity
  "Why do I feel so drained lately?",
  "What are my hidden talents based on my chart?",
  "Why do people always misread me?",
  "What's my biggest strength and my blind spot?",
  // Career & purpose
  "What career path fits my chart?",
  "Should I trust my gut on this big decision?",
  "When is the best time to make a move at work?",
  // Cosmic timing
  "Is Mercury retrograde messing with me right now?",
  "What should I watch out for this week?",
  "Why has everything felt so chaotic lately?",
  "What does today's moon mean for me?",
];

const Q_AFTER_LOVE = [
  "So what's my attachment style based on my chart?",
  "Will this situationship actually go anywhere?",
  "What's my Venus sign say about what I really want?",
  "Why am I attracted to people who are unavailable?",
  "How do I stop repeating the same relationship patterns?",
  "What signs should I avoid dating?",
];

const Q_AFTER_CAREER = [
  "Is this year good for a career change?",
  "What's blocking my success right now?",
  "Am I in the right field for my chart?",
  "When will things start clicking professionally?",
  "What does my midheaven say about my path?",
];

const Q_AFTER_SELF = [
  "What's my moon sign actually mean for my emotions?",
  "Why do I overthink everything?",
  "What part of myself am I not seeing clearly?",
  "How do I use my rising sign energy better?",
  "What does my chart say I need to let go of?",
];

const Q_AFTER_TRANSIT = [
  "How long will this energy last?",
  "What should I do differently during this transit?",
  "Is this affecting my relationships too?",
  "When does this shift?",
  "What's the next big transit I should know about?",
];

const Q_GENERIC_FOLLOWUP = [
  "Tell me more about that",
  "What else should I know?",
  "How does that play out in my daily life?",
  "Is there a way to work with this energy?",
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
  "What's my chart say about what I really need?",
  "Why can't I let go of this person?",
];

const Q_FUN = [
  "What's my biggest red flag? 😈",
  "Roast my chart",
  "What sign should I NEVER date?",
  "What's my secret superpower?",
  "Why are {randomSign}s like that?",
  "What do people assume about me that's wrong?",
];

// Transit-triggered prompts (injected when transit is active)
const Q_TRANSIT_MERCURY_RX = [
  "Mercury retrograde is happening — what should I watch for?",
  "Is Mercury retrograde why everything feels off?",
];
const Q_TRANSIT_FULL_MOON = [
  "Full moon tonight — how does it affect me?",
  "What should I release this full moon?",
];
const Q_TRANSIT_NEW_MOON = [
  "New moon today — what should I set intentions for?",
  "What new beginning is the new moon activating for me?",
];

const RANDOM_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

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

  // Replace {randomSign} placeholder, avoiding user's own sun sign
  const userSun = userProfile?.chart?.planets?.find(p => p.name === 'Sun')?.sign;
  return picked.map(q => {
    if (q.includes('{randomSign}')) {
      const options = RANDOM_SIGNS.filter(s => s !== userSun);
      return q.replace('{randomSign}', options[Math.floor(Math.random() * options.length)]);
    }
    return q;
  });
}

// ── SIMPLE MARKDOWN RENDERER ─────────────────────────────────
// Converts **bold**, *italic*, and newlines into styled Text spans.
function renderMarkdown(text, baseStyle) {
  // Split by bold first (**...**), then italic (*...*)
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
  { key: 'today', label: "Today's Energy", icon: '☉' },
];

export default function ChatScreen({ navigation, route }) {
  const { isPro } = useRevenueCat();
  const insets = useSafeAreaInsets();
  // Tab bar is hidden on this screen, so only need safe area bottom
  const bottomPadding = Math.max(insets.bottom, 10);
  const previousTab = route?.params?.previousTab || 'Today';
  const { capture } = useAnalytics();
  const { colors, isDark } = useTheme();

  const { userProfile } = useUserProfile();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState(null); // full session object from createChatSession
  const [suggestions, setSuggestions] = useState([]);
  const [chatTheme, setChatTheme] = useState('open');
  const [remainingMsgs, setRemainingMsgs] = useState(null); // null = pro or unchecked
  const [limitReached, setLimitReached] = useState(false);
  const [showUpgradeNudge, setShowUpgradeNudge] = useState(false);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);

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
      await Share.share({
        message: `${clean}\n\n— Celestia ✦ Your cosmic guide\ncelestia.app`,
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

  const [proactiveInsight, setProactiveInsight] = useState(null);
  const [narrativeCtx, setNarrativeCtx] = useState(null);

  const name = userProfile?.name?.split(' ')[0] || 'Stargazer';
  const sun = userProfile?.chart?.planets?.find(p => p.name === 'Sun');
  const moon = userProfile?.chart?.planets?.find(p => p.name === 'Moon');
  const rising = userProfile?.chart?.planets?.find(p => p.name === 'Ascendant');

  const ctxChips = [
    sun && `☉ ${sun.sign} Sun`,
    moon && `☽ ${moon.sign} Moon`,
    rising && `↑ ${rising.sign} Rising`,
  ].filter(Boolean);

  // Build narrative-aware greeting
  const buildNarrativeGreeting = (ctx) => {
    if (!ctx) return "What's on your mind today?";
    const parts = [];
    if (ctx.season) {
      parts.push(`You're ${ctx.season.progress}% through your ${ctx.season.planet}-${ctx.season.natalTarget} season — ${ctx.season.description?.toLowerCase()}.`);
    }
    if (ctx.mercuryRx) {
      parts.push("Mercury is retrograde, so communication needs extra awareness.");
    }
    if (ctx.yesterday?.journalMood) {
      const moodMap = { great: 'wonderful', good: 'good', okay: 'okay', low: 'heavy', anxious: 'anxious' };
      parts.push(`You felt ${moodMap[ctx.yesterday.journalMood] || ctx.yesterday.journalMood} yesterday.`);
    }
    if (ctx.today?.moonData?.sign) {
      parts.push(`The Moon is in ${ctx.today.moonData.sign} today.`);
    }
    parts.push("What would you like to explore?");
    return parts.join(' ');
  };

  const makeGreeting = (id = 'greeting', ctx = null) => {
    const hour = new Date().getHours();
    const timeGreet = hour >= 22 || hour < 5 ? 'Hey' : hour >= 17 ? 'Good evening' : hour >= 12 ? 'Good afternoon' : 'Good morning';

    let body;
    if (ctx) {
      body = buildNarrativeGreeting(ctx);
    } else if (sun) {
      // Chart-aware fallback — no "I am Celestia" intro
      const moonNote = moon ? `Your ${moon.sign} Moon is ${hour >= 20 ? 'wide awake right now' : 'processing beneath the surface'}.` : '';
      body = `${sun.sign} Sun${moon ? ` · ${moon.sign} Moon` : ''}${rising ? ` · ${rising.sign} Rising` : ''}. ${moonNote} What's on your mind?`;
    } else {
      body = 'What\'s on your mind tonight?';
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

    // Build proactive insight from today's transits
    try {
      const today = new Date();
      const windows = userProfile.chart ? getActiveCosmicWindows(userProfile.chart, today) : [];
      const moonData = getMoonDataForDate(today);
      if (windows.length > 0) {
        const w = windows[0];
        setProactiveInsight({
          title: 'Something is active in your chart',
          body: `${w.description}. Ask me what this means for you.`,
          question: `What does ${w.planet} ${w.type === 'exact_aspect' ? `${w.aspect?.toLowerCase()} my ${w.natalPlanet}` : `in my ${w.targetSign} sign`} mean for me right now?`,
        });
      } else if (moonData) {
        setProactiveInsight({
          title: `Moon in ${moonData.sign} today`,
          body: `The ${moonData.phaseName} may be stirring something for your ${moon?.sign || ''} Moon. Ask me about it.`,
          question: `How does the Moon in ${moonData.sign} affect my ${moon?.sign || 'natal'} Moon today?`,
        });
      }
    } catch (e) { }
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
      // Inject theme context into session
      if (activeTheme !== 'open' && chatSession?.systemInstruction) {
        const themePrompts = {
          love: '\nSESSION THEME: Love & Relationships. Focus all responses on love, relationships, emotional bonds, Venus/Moon dynamics. The user wants to explore their love life.',
          career: '\nSESSION THEME: Career & Purpose. Focus all responses on career, ambition, 10th house, Saturn, professional path. The user wants career guidance.',
          growth: '\nSESSION THEME: Growth & Self-Discovery. Focus on inner work, North Node, Jupiter, 12th house, spiritual growth. The user wants to understand themselves deeper.',
          today: '\nSESSION THEME: Today\'s Energy. Focus on current transits, today\'s Moon, active cosmic windows. The user wants to understand what\'s happening right now.',
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

    // Check message limit for free users — soft nudge at 5, hard block at 10
    const FREE_DAILY_LIMIT = 10;
    const UPGRADE_NUDGE_AT = 5;
    if (!isPro) {
      try {
        const count = await ChatRepository.getUserMessageCountForDay(Date.now());
        const remaining = Math.max(0, FREE_DAILY_LIMIT - count);
        setRemainingMsgs(remaining);
        if (count >= FREE_DAILY_LIMIT) {
          haptic.light();
          setLimitReached(true);
          return;
        }
        // Show upgrade nudge after 5 messages
        if (count === UPGRADE_NUDGE_AT) {
          setShowUpgradeNudge(true);
        }
      } catch (e) {
        console.error('Failed to check message count:', e);
      }
    }

    haptic.light();

    setInputText('');

    // Optimistically add user message to UI
    const userMsg = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

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
        text: 'The cosmic connection is momentarily veiled. Please try again.',
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errMsg]);
    } finally {
      setSending(false);
    }
  };

  return (
    <View
      style={[styles.wrap, { backgroundColor: colors.bg }]}
    >
      {/* Minimal sticky top bar — stays visible */}
      {/* Sticky top bar: X | ☽ Celestia | history | + new */}
      <View style={{
        flexDirection: 'row', alignItems: 'center',
        paddingTop: insets.top + 6, paddingHorizontal: 16, paddingBottom: 8,
        backgroundColor: colors.bg,
      }}>
        <TouchableOpacity
          style={[styles.dismissBtn, { backgroundColor: colors.cardAlt, borderColor: colors.border }]}
          activeOpacity={0.7}
          onPress={() => { haptic.light(); navigation.navigate(previousTab); }}
        >
          <X size={18} color={colors.text} strokeWidth={2.5} />
        </TouchableOpacity>
        <LinearGradient colors={['#0E0E22', '#1A1060']} style={[styles.chatOrb, { width: 30, height: 30, borderRadius: 15, marginLeft: 8 }]}>
          <Text style={{ fontSize: 15, color: '#C8A84B' }}>☽</Text>
        </LinearGradient>
        <Text style={{ fontFamily: FONTS.serifMedium, fontSize: 16, color: colors.heading, flex: 1, marginLeft: 8 }}>Celestia</Text>
        {/* History icon */}
        <TouchableOpacity
          onPress={loadChatHistory}
          activeOpacity={0.7}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: colors.cardAlt, borderWidth: 1, borderColor: colors.border,
            alignItems: 'center', justifyContent: 'center', marginRight: 8,
          }}
        >
          <Text style={{ fontSize: 15 }}>🕘</Text>
        </TouchableOpacity>
        {/* New chat + icon */}
        <TouchableOpacity
          onPress={startNewSession}
          activeOpacity={0.7}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: T.gold, alignItems: 'center', justifyContent: 'center',
          }}
        >
          <Text style={{ fontSize: 20, color: T.navy, fontWeight: '300', marginTop: -1 }}>+</Text>
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
            <LinearGradient colors={['#0E0E22', '#1A1060']} style={[styles.chatOrb, { width: 52, height: 52, borderRadius: 26, marginBottom: 10 }]}>
              <Text style={{ fontSize: 28, color: '#C8A84B' }}>☽</Text>
            </LinearGradient>
            <Text style={{ fontFamily: FONTS.serifMedium, fontSize: 18, color: colors.heading, marginBottom: 2 }}>Celestia</Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary }}>
              {new Date().getHours() >= 22 || new Date().getHours() < 5 ? 'Night session' : new Date().getHours() >= 17 ? 'Evening session' : 'Always here'}
            </Text>
          </View>
        )}

        {/* Proactive Insight Card */}
        {proactiveInsight && messages.length <= 2 && (
          <TouchableOpacity
            style={[styles.proactiveCard, isDark && { backgroundColor: 'rgba(107,92,165,0.12)', borderColor: 'rgba(107,92,165,0.25)' }]}
            activeOpacity={0.8}
            onPress={() => {
              setProactiveInsight(null);
              handleSend(proactiveInsight.question);
            }}>
            <Text style={[styles.proactiveLabel, isDark && { color: colors.lavender }]}>COSMIC INSIGHT</Text>
            <Text style={[styles.proactiveTitle, isDark && { color: colors.heading }]}>{proactiveInsight.title}</Text>
            <Text style={[styles.proactiveBody, isDark && { color: colors.textSecondary }]}>{proactiveInsight.body}</Text>
            <Text style={[styles.proactiveCTA, isDark && { color: colors.lavender }]}>Tap to ask →</Text>
          </TouchableOpacity>
        )}

        {messages.map((m, i) => (
          <View key={m.id || i}>
            <View style={[styles.mrow, m.role === 'user' && styles.mrowUser]}>
              <LinearGradient
                colors={m.role === 'model' ? ['#0E0E22', '#1A1060'] : ['#E2C46A', '#8C6C18']}
                style={styles.morb}
              >
                <Text style={{ fontSize: 13, color: m.role === 'model' ? '#C8A84B' : 'white' }}>{m.role === 'model' ? '☽' : name[0]?.toUpperCase()}</Text>
              </LinearGradient>
              <View style={[styles.mbub, m.role === 'model' ? [styles.mbubAi, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.07 }] : styles.mbubUser]}>
                <Text style={[styles.mbubText, { color: colors.text }, m.role === 'user' && { color: T.cream }]}>
                  {m.role === 'model'
                    ? renderMarkdown(m.text, [styles.mbubText, { color: colors.text }])
                    : m.text}
                </Text>
              </View>
            </View>
            <View style={[styles.mtimeRow, m.role === 'user' && { flexDirection: 'row-reverse' }]}>
              <Text style={[styles.mtime, { color: colors.textMuted }]}>{formatTime(m.timestamp)}</Text>
              {m.role === 'model' && m.id !== 'greeting' && m.id !== 'greeting_new' && (
                <TouchableOpacity style={styles.shareBtn} activeOpacity={0.7} onPress={() => shareResponse(m.text)}>
                  <Text style={styles.shareBtnText}>Share ↗</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ))}

        {sending && (
          <View style={styles.mrow}>
            <LinearGradient colors={['#0E0E22', '#1A1060']} style={styles.morb}>
              <Text style={{ fontSize: 13, color: '#C8A84B' }}>☽</Text>
            </LinearGradient>
            <View style={[styles.typingWrap, { backgroundColor: colors.card, shadowOpacity: isDark ? 0 : 0.07 }]}>
              <ActivityIndicator size="small" color={colors.textSecondary} />
            </View>
          </View>
        )}
      </ScrollView>

      <KeyboardStickyView offset={{ closed: 0, opened: Platform.OS === 'ios' ? 0 : 0 }}>
      <View style={{ paddingBottom: keyboardVisible ? 6 : bottomPadding, backgroundColor: colors.bg, zIndex: 100 }}>
        {/* Suggestions */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.suggestStrip, { backgroundColor: colors.bg }]} contentContainerStyle={{ paddingHorizontal: 17, gap: 7 }}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={`${s}_${i}`} style={[styles.schip, { backgroundColor: colors.card, borderColor: colors.border }]} activeOpacity={0.7} onPress={() => { setInputText(s); haptic.light(); }}>
              <Text style={[styles.schipText, { color: colors.text }]}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Upgrade nudge at 5 messages — dismissible */}
        {showUpgradeNudge && (
          <View style={[styles.limitBanner, { backgroundColor: isDark ? 'rgba(200,168,75,0.08)' : 'rgba(200,168,75,0.1)', borderTopColor: isDark ? 'rgba(200,168,75,0.15)' : 'rgba(200,168,75,0.12)' }]}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: colors.heading }}>Loving the conversation? ✨</Text>
              <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>Go Pro for unlimited chats — share with friends too</Text>
            </View>
            <TouchableOpacity onPress={() => { setShowUpgradeNudge(false); navigation.navigate('Paywall', { source: 'chat_nudge' }); }}>
              <Text style={styles.limitLink}>Upgrade →</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setShowUpgradeNudge(false)} style={{ marginLeft: 8, padding: 4 }}>
              <Text style={{ fontSize: 14, color: colors.textSecondary }}>✕</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Remaining messages counter (free users, shows at ≤5 remaining) */}
        {!isPro && remainingMsgs !== null && remainingMsgs <= 5 && remainingMsgs > 0 && !showUpgradeNudge && (
          <View style={[styles.limitBanner, { backgroundColor: colors.goldDim, borderTopColor: isDark ? 'rgba(200,168,75,0.15)' : 'rgba(200,168,75,0.12)' }]}>
            <Text style={[styles.limitText, { color: colors.textSecondary }]}>{remainingMsgs} {remainingMsgs === 1 ? 'message' : 'messages'} left today</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Paywall', { source: 'chat_soft' })}>
              <Text style={styles.limitLink}>Go unlimited →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Input — or gentle upgrade prompt when limit reached */}
        {limitReached ? (
          <View style={[styles.inputBar, { flexDirection: 'column', alignItems: 'center', gap: 10, paddingVertical: 16, backgroundColor: colors.bg, borderTopColor: colors.border }]}>
            <Text style={{ fontFamily: FONTS.serif, fontSize: 15, color: colors.heading, textAlign: 'center' }}>
              You've used all 10 messages today
            </Text>
            <Text style={{ fontSize: 12, color: colors.textSecondary, textAlign: 'center', lineHeight: 18, paddingHorizontal: 20 }}>
              They reset at midnight. Or keep the conversation going now.
            </Text>
            <TouchableOpacity
              style={{ backgroundColor: T.navy, borderRadius: 100, paddingVertical: 11, paddingHorizontal: 28, marginTop: 4 }}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('Paywall', { source: 'chat_limit' })}>
              <Text style={{ fontFamily: FONTS.sansMedium, fontSize: 13, color: T.cream }}>Keep Chatting →</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={[styles.inputBar, { backgroundColor: colors.bg, borderTopColor: colors.border }]}>
            <View style={[styles.inputField, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
              <TextInput
                style={[styles.inputText, { color: colors.text }]}
                value={inputText}
                onChangeText={setInputText}
                placeholder="Ask the cosmos anything..."
                placeholderTextColor={colors.inputPlaceholder}
                multiline
                maxLength={500}
                onSubmitEditing={() => handleSend()}
              />
            </View>
            <TouchableOpacity activeOpacity={0.7} onPress={() => handleSend()} disabled={sending || !inputText.trim()}>
              <LinearGradient colors={[T.navy, T.navy]} style={[styles.sendBtn, (!inputText.trim() || sending) && { opacity: 0.5 }]}>
                <Text style={{ fontSize: 17, color: 'white' }}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </View>
      </KeyboardStickyView>

      {/* Chat History Modal */}
      {showHistory && (
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg, zIndex: 200 }}>
          {/* History Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: Platform.OS === 'ios' ? 62 : 40, paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: colors.border }}>
            <TouchableOpacity onPress={() => setShowHistory(false)} style={{ padding: 4 }}>
              <Text style={{ fontSize: 18, color: colors.textSecondary }}>←</Text>
            </TouchableOpacity>
            <Text style={{ fontFamily: FONTS.serifMedium, fontSize: 20, color: colors.heading, flex: 1, textAlign: 'center' }}>Chat History</Text>
            <TouchableOpacity onPress={() => { setShowHistory(false); startNewSession(); }} style={{ padding: 4 }}>
              <Text style={{ fontSize: 13, color: T.gold, fontFamily: FONTS.sansSemiBold }}>+ New</Text>
            </TouchableOpacity>
          </View>

          {/* Session List */}
          <ScrollView style={{ flex: 1, paddingHorizontal: 16, paddingTop: 12 }}>
            {chatSessions.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 80 }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>☽</Text>
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
                    <TouchableOpacity onPress={() => switchToSession(s)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(200,168,75,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                        <Text style={{ fontSize: 16, color: T.gold }}>☽</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text numberOfLines={1} style={{ fontSize: 14, fontFamily: FONTS.sansMedium, color: colors.heading }}>{s.title || 'Untitled chat'}</Text>
                        <Text style={{ fontSize: 11, color: colors.textSecondary, marginTop: 2 }}>{dateStr} · {timeStr}</Text>
                      </View>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteSessionById(s.id)} style={{ padding: 6 }}>
                      <Text style={{ fontSize: 14, color: colors.textMuted }}>✕</Text>
                    </TouchableOpacity>
                  </View>
                );
              })
            )}
            <View style={{ height: 40 }} />
          </ScrollView>
        </View>
      )}
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
  proactiveLabel: { fontSize: 8, fontFamily: FONTS.sansSemiBold, letterSpacing: 1.5, color: '#6B5CA5', marginBottom: 6 },
  proactiveTitle: { fontFamily: FONTS.serif, fontSize: 16, color: '#2A2060', marginBottom: 4 },
  proactiveBody: { fontSize: 13, color: '#5A5090', lineHeight: 19, marginBottom: 8 },
  proactiveCTA: { fontSize: 11, fontFamily: FONTS.sansSemiBold, color: '#6B5CA5' },
  // Message time + share row
  mtimeRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4, paddingHorizontal: 4 },
  shareBtn: { paddingVertical: 2, paddingHorizontal: 6 },
  shareBtnText: { fontSize: 10, color: T.gold, fontFamily: FONTS.sansMedium },
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
