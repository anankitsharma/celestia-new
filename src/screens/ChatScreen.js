import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  TextInput, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { T, FONTS } from '../constants/theme';
import { useUserProfile } from '../contexts/UserProfileContext';
import { createChatSession, sendChatMessage } from '../services/geminiService';
import { ChatRepository } from '../services/database/rep_chats';

const SUGGESTIONS = ['My birth chart', "This week's transits", 'Love compatibility', 'Career guidance', 'Moon phase today', 'My strengths'];

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

  // Initialize: load latest session history OR start fresh, then create AI session
  useEffect(() => {
    if (!userProfile) return;
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

  // Auto-scroll on new messages
  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
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
    <KeyboardAvoidingView style={styles.wrap} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.aiRow}>
          <LinearGradient colors={['#0E0E22', '#1A1060']} style={styles.chatOrb}>
            <Text style={{ fontSize: 21, color: 'white' }}>✦</Text>
            <View style={styles.orbDot} />
          </LinearGradient>
          <View>
            <Text style={styles.aiName}>Celestia AI</Text>
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
      >
        {messages.map((m, i) => (
          <View key={m.id || i}>
            <View style={[styles.mrow, m.role === 'user' && styles.mrowUser]}>
              <LinearGradient
                colors={m.role === 'model' ? ['#0E0E22', '#1A1060'] : ['#E2C46A', '#8C6C18']}
                style={styles.morb}
              >
                <Text style={{ fontSize: 12, color: 'white' }}>{m.role === 'model' ? '✦' : name[0]?.toUpperCase()}</Text>
              </LinearGradient>
              <View style={[styles.mbub, m.role === 'model' ? styles.mbubAi : styles.mbubUser]}>
                <Text style={[styles.mbubText, m.role === 'user' && { color: T.cream }]}>{m.text}</Text>
              </View>
            </View>
            <Text style={[styles.mtime, m.role === 'user' && { textAlign: 'right' }]}>{formatTime(m.timestamp)}</Text>
          </View>
        ))}

        {sending && (
          <View style={styles.mrow}>
            <LinearGradient colors={['#0E0E22', '#1A1060']} style={styles.morb}>
              <Text style={{ fontSize: 12, color: 'white' }}>✦</Text>
            </LinearGradient>
            <View style={styles.typingWrap}>
              <ActivityIndicator size="small" color={T.stone} />
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggestions */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestStrip} contentContainerStyle={{ paddingHorizontal: 17, gap: 7 }}>
        {SUGGESTIONS.map((s, i) => (
          <TouchableOpacity key={i} style={styles.schip} activeOpacity={0.7} onPress={() => handleSend(s)}>
            <Text style={styles.schipText}>{s}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

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
    </KeyboardAvoidingView>
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
