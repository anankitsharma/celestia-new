import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, Platform, ActivityIndicator, Keyboard, Animated
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { createChatSession, sendChatMessage } from '../services/geminiService';
import { ChatRepository } from '../services/database/rep_chats';
import { haptic } from '../services/hapticService';
import { trackEvent } from '../services/achievementService';
import { awardXP } from '../services/xpService';

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

const RANDOM_SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

function pickSuggestions(messages, userProfile) {
  const msgCount = messages.filter(m => m.role === 'user').length;
  const lastAiText = [...messages].reverse().find(m => m.role === 'model')?.text?.toLowerCase() || '';
  const lastUserText = [...messages].reverse().find(m => m.role === 'user')?.text?.toLowerCase() || '';
  const combined = lastAiText + ' ' + lastUserText;

  let pool;

  if (msgCount === 0) {
    // First message — show initial natural questions
    pool = Q_INITIAL;
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

export default function ChatScreen({ route }) {
  const { userProfile } = useUserProfile();
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState(null); // full session object from createChatSession
  const [suggestions, setSuggestions] = useState([]);
  const [kbVisible, setKbVisible] = useState(false);
  const kbHeight = useRef(new Animated.Value(0)).current;
  const scrollRef = useRef(null);
  const initialMessageSent = useRef(false);

  const name = userProfile?.name?.split(' ')[0] || 'Stargazer';
  const sun = userProfile?.chart?.planets?.find(p => p.name === 'Sun');
  const moon = userProfile?.chart?.planets?.find(p => p.name === 'Moon');
  const rising = userProfile?.chart?.planets?.find(p => p.name === 'Ascendant');

  const ctxChips = [
    sun && `☉ ${sun.sign} Sun`,
    moon && `☽ ${moon.sign} Moon`,
    rising && `↑ ${rising.sign} Rising`,
  ].filter(Boolean);

  // Build greeting message
  const makeGreeting = (id = 'greeting') => ({
    id,
    role: 'model',
    text: `Good day, ${name} ✦\n\nI am Celestia, your cosmic guide. ${sun ? `With your ${sun.sign} Sun${moon ? `, ${moon.sign} Moon` : ''}${rising ? ` and ${rising.sign} Rising` : ''}, ` : ''}I'm here to illuminate the celestial patterns shaping your journey.\n\nWhat would you like to explore?`,
    timestamp: Date.now()
  });

  // Track keyboard with animated height for smooth transitions
  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const subShow = Keyboard.addListener(showEvent, (e) => {
      setKbVisible(true);
      Animated.timing(kbHeight, {
        toValue: e.endCoordinates.height,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: false,
      }).start();
    });
    const subHide = Keyboard.addListener(hideEvent, (e) => {
      setKbVisible(false);
      Animated.timing(kbHeight, {
        toValue: 0,
        duration: Platform.OS === 'ios' ? e.duration || 250 : 200,
        useNativeDriver: false,
      }).start();
    });
    return () => { subShow.remove(); subHide.remove(); };
  }, []);

  // Initialize: load latest session history OR start fresh, then create AI session
  useEffect(() => {
    if (!userProfile) return;
    setSuggestions(pickSuggestions([], userProfile));
    initChat();
  }, [userProfile]);

  const initChat = async () => {
    const greeting = makeGreeting();
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
      const chatSession = await createChatSession(userProfile, null, loadedSessionId);
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
    setSuggestions(pickSuggestions(messages, userProfile));
  }, [messages]);

  // Start a brand new chat session
  const startNewSession = async () => {
    const greeting = makeGreeting('greeting_new');
    setMessages([greeting]);
    initialMessageSent.current = false;

    try {
      const chatSession = await createChatSession(userProfile, null, null);
      setSession(chatSession);
    } catch (e) {
      console.error('Failed to create new session:', e);
    }
  };

  // Send a message using the proper createChatSession + sendChatMessage pipeline
  const handleSend = async (textOverride) => {
    const text = (textOverride || inputText || '').trim();
    if (!text || sending) return;
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
        currentSession = await createChatSession(userProfile, null, null);
        setSession(currentSession);
      }

      if (!currentSession) {
        throw new Error('No session available');
      }

      // Use the reference pattern: sendChatMessage handles:
      // 1. Persisting transient session if needed
      // 2. Saving user message to DB
      // 3. Calling Gemini with full chart-aware system instruction + history
      // 4. Saving AI response to DB
      // 5. Updating session.history in-memory
      const responseText = await sendChatMessage(currentSession, text);

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
      trackEvent('chat_message').catch(() => {});
      awardXP(profileId, 'chat_message').catch(() => {});

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
    <View style={styles.wrap}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiRow}>
          <LinearGradient colors={['#0E0E22', '#1A1060']} style={styles.chatOrb}>
            <Text style={{ fontSize: 22, color: '#C8A84B' }}>☽</Text>
            <View style={styles.orbDot} />
          </LinearGradient>
          <View>
            <Text style={styles.aiName}>Ask Celestia</Text>
            <Text style={styles.aiSub}>Your cosmic guide</Text>
          </View>
          <TouchableOpacity style={styles.newChatBtn} onPress={startNewSession}>
            <Text style={styles.newChatBtnText}>New Chat</Text>
          </TouchableOpacity>
        </View>
        {ctxChips.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ctxBar}>
            {ctxChips.map((c, i) => (
              <View key={i} style={styles.ctxChip}><Text style={styles.ctxChipText}>{c}</Text></View>
            ))}
          </ScrollView>
        )}
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.msgs}
        contentContainerStyle={{ paddingVertical: 17, paddingHorizontal: 17, gap: 15 }}
        keyboardDismissMode="interactive"
        keyboardShouldPersistTaps="handled"
      >
        {messages.map((m, i) => (
          <View key={m.id || i}>
            <View style={[styles.mrow, m.role === 'user' && styles.mrowUser]}>
              <LinearGradient
                colors={m.role === 'model' ? ['#0E0E22', '#1A1060'] : ['#E2C46A', '#8C6C18']}
                style={styles.morb}
              >
                <Text style={{ fontSize: 13, color: m.role === 'model' ? '#C8A84B' : 'white' }}>{m.role === 'model' ? '☽' : name[0]?.toUpperCase()}</Text>
              </LinearGradient>
              <View style={[styles.mbub, m.role === 'model' ? styles.mbubAi : styles.mbubUser]}>
                <Text style={[styles.mbubText, m.role === 'user' && { color: T.cream }]}>
                  {m.role === 'model'
                    ? renderMarkdown(m.text, [styles.mbubText])
                    : m.text}
                </Text>
              </View>
            </View>
            <Text style={[styles.mtime, m.role === 'user' && { textAlign: 'right' }]}>{formatTime(m.timestamp)}</Text>
          </View>
        ))}

        {sending && (
          <View style={styles.mrow}>
            <LinearGradient colors={['#0E0E22', '#1A1060']} style={styles.morb}>
              <Text style={{ fontSize: 13, color: '#C8A84B' }}>☽</Text>
            </LinearGradient>
            <View style={styles.typingWrap}>
              <ActivityIndicator size="small" color={T.stone} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggestions — hidden when keyboard is up */}
      {!kbVisible && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestStrip} contentContainerStyle={{ paddingHorizontal: 17, gap: 7 }}>
          {suggestions.map((s, i) => (
            <TouchableOpacity key={`${s}_${i}`} style={styles.schip} activeOpacity={0.7} onPress={() => handleSend(s)}>
              <Text style={styles.schipText}>{s}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input */}
      <View style={styles.inputBar}>
        <View style={styles.inputField}>
          <TextInput
            style={styles.inputText}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Ask the cosmos anything..."
            placeholderTextColor="#B0A898"
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

      {/* Animated spacer — pushes input above keyboard */}
      <Animated.View style={{ height: kbHeight }} />
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
  newChatBtn: { marginLeft: 'auto', backgroundColor: T.warm, borderRadius: 100, paddingVertical: 6, paddingHorizontal: 14, borderWidth: 1, borderColor: T.border },
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
  mtime: { fontSize: 10, color: '#C0B8A4', marginTop: 4, paddingHorizontal: 4 },
  typingWrap: { backgroundColor: 'white', borderRadius: 18, borderBottomLeftRadius: 5, padding: 12, paddingHorizontal: 16, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.07, shadowRadius: 7 },
  suggestStrip: { flexGrow: 0, paddingVertical: 7 },
  schip: { backgroundColor: 'white', borderWidth: 1, borderColor: T.border, borderRadius: 100, paddingVertical: 7, paddingHorizontal: 14 },
  schipText: { fontSize: 12, color: T.ink },
  inputBar: { paddingHorizontal: 17, paddingTop: 9, paddingBottom: 28, backgroundColor: T.cream, borderTopWidth: 1, borderTopColor: T.border, flexDirection: 'row', gap: 9, alignItems: 'flex-end' },
  inputField: { flex: 1, minHeight: 48, maxHeight: 120, backgroundColor: 'white', borderWidth: 1.5, borderColor: T.border, borderRadius: 24, paddingHorizontal: 17, justifyContent: 'center' },
  inputText: { fontSize: 14, color: T.ink, paddingVertical: 12 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', shadowColor: T.navy, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.22, shadowRadius: 12 },
});
