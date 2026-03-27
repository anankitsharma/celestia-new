'use client';
import React, { useState, useRef, useEffect } from 'react';
import { useUserProfile } from '@/lib/UserProfileContext';
import { createChatSession, sendChatMessage } from '@/lib/geminiService';
import { defaultConversationState } from '@/lib/chat/conversationTypes';
import { ChatRepository } from '@/lib/database/rep_chats';
import { getActiveCosmicWindows, getMoonDataForDate } from '@/lib/astrologyService';
import { getNarrativeContext } from '@/lib/narrativeService';
import { X } from 'lucide-react';
import { T } from '@/lib/constants';
import { useTheme } from '@/lib/ThemeContext';

// ── DYNAMIC SUGGESTION QUESTIONS ─────────────────────────────
const Q_INITIAL = [
  "Why do I keep dating the same type of person?",
  "What does my chart say about my love life?",
  "Am I compatible with a {randomSign}?",
  "Why is it so hard for me to open up emotionally?",
  "What kind of partner is actually right for me?",
  "Why do I feel so drained lately?",
  "What are my hidden talents based on my chart?",
  "Why do people always misread me?",
  "What's my biggest strength and my blind spot?",
  "What career path fits my chart?",
  "Should I trust my gut on this big decision?",
  "When is the best time to make a move at work?",
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
  "What's my biggest red flag? \ud83d\ude08",
  "Roast my chart",
  "What sign should I NEVER date?",
  "What's my secret superpower?",
  "Why are {randomSign}s like that?",
  "What do people assume about me that's wrong?",
];

const Q_TRANSIT_MERCURY_RX = [
  "Mercury retrograde is happening \u2014 what should I watch for?",
  "Is Mercury retrograde why everything feels off?",
];
const Q_TRANSIT_FULL_MOON = [
  "Full moon tonight \u2014 how does it affect me?",
  "What should I release this full moon?",
];
const Q_TRANSIT_NEW_MOON = [
  "New moon today \u2014 what should I set intentions for?",
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
    if (theme === 'love') pool = Q_AFTER_LOVE;
    else if (theme === 'career') pool = Q_AFTER_CAREER;
    else if (theme === 'growth') pool = Q_AFTER_SELF;
    else if (theme === 'today') pool = Q_AFTER_TRANSIT;
    else {
      const hour = new Date().getHours();
      if (hour >= 7 && hour < 10) {
        pool = [...Q_MORNING, ...Q_INITIAL.slice(0, 4)];
      } else if (hour >= 20 || hour < 3) {
        pool = [...Q_EVENING, ...Q_FUN.slice(0, 2)];
      } else {
        pool = [...Q_INITIAL, ...Q_FUN.slice(0, 2)];
      }
    }

    if (transitCtx?.mercuryRx) pool = [...Q_TRANSIT_MERCURY_RX.slice(0, 1), ...pool];
    if (transitCtx?.moonPhase === 'Full Moon') pool = [...Q_TRANSIT_FULL_MOON.slice(0, 1), ...pool];
    if (transitCtx?.moonPhase === 'New Moon') pool = [...Q_TRANSIT_NEW_MOON.slice(0, 1), ...pool];
  } else {
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

  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const picked = shuffled.slice(0, msgCount === 0 ? 5 : 4);

  if (msgCount > 0 && Math.random() > 0.5) {
    const generic = Q_GENERIC_FOLLOWUP[Math.floor(Math.random() * Q_GENERIC_FOLLOWUP.length)];
    picked.push(generic);
  }

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
function renderMarkdown(text, baseStyle) {
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
    <span
      key={i}
      style={{
        ...baseStyle,
        ...(p.bold ? { fontFamily: 'var(--font-sans)', fontWeight: 600 } : {}),
        ...(p.italic ? { fontStyle: 'italic' } : {}),
      }}
    >
      {p.text}
    </span>
  ));
}

const formatTime = (ts) => {
  const d = new Date(ts);
  let h = d.getHours(), m = d.getMinutes().toString().padStart(2, '0');
  const ap = h >= 12 ? 'PM' : 'AM'; h = h % 12 || 12;
  return `${h}:${m} ${ap}`;
};

const CHAT_THEMES = [
  { key: 'open', label: 'Open', icon: '\u2726' },
  { key: 'love', label: 'Love', icon: '\u2661' },
  { key: 'career', label: 'Career', icon: '\u25c6' },
  { key: 'growth', label: 'Growth', icon: '\ud83c\udf31' },
  { key: 'today', label: "Today's Energy", icon: '\u2609' },
];

// colors provided by useTheme() inside the component

export default function ChatScreen({ onClose, initialMessage: initialMessageProp }) {
  const { colors, isDark } = useTheme();
  const isPro = false; // useRevenueCat removed
  const bottomPadding = 34; // iOS safe area bottom
  const previousTab = 'Today';

  const { profile, chart } = useUserProfile();
  const userProfile = profile ? { ...profile, chart } : null;
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [session, setSession] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [chatTheme, setChatTheme] = useState('open');
  const [remainingMsgs, setRemainingMsgs] = useState(null);
  const [limitReached, setLimitReached] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [chatSessions, setChatSessions] = useState([]);
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  // Track iOS keyboard via visualViewport — keeps input above keyboard
  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return;
    const vv = window.visualViewport;
    const handleResize = () => {
      const offset = window.innerHeight - vv.height;
      setKeyboardOffset(offset > 50 ? offset : 0);
    };
    vv.addEventListener('resize', handleResize);
    vv.addEventListener('scroll', handleResize);
    return () => {
      vv.removeEventListener('resize', handleResize);
      vv.removeEventListener('scroll', handleResize);
    };
  }, []);

  const shareResponse = async (text) => {
    try {
      const clean = text.replace(/\*\*/g, '').replace(/\*/g, '');
      if (navigator.share) {
        await navigator.share({
          text: `${clean}\n\n\u2014 Celestia \u2726 Your cosmic guide\ncelestia.app`,
        });
      }
    } catch (e) { }
  };

  // Intercept browser back when history panel is open
  useEffect(() => {
    if (!showHistory) return;
    const handlePopState = () => { setShowHistory(false); };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [showHistory]);

  const loadChatHistory = async () => {
    try {
      const sessions = await ChatRepository.getSessions(20);
      setChatSessions(sessions || []);
      setShowHistory(true);
      // Push history entry so back button closes panel instead of navigating away
      window.history.pushState({ chatHistory: true }, '');
    } catch (e) { console.error('Failed to load chat history:', e); }
  };

  const switchToSession = async (s) => {
    try {
      const msgs = await ChatRepository.getMessages(s.id);
      setMessages(msgs.map(m => ({ id: m.id || String(m.timestamp), role: m.role, text: m.text, timestamp: m.timestamp })));
      // Re-create AI session with conversation intelligence
      if (userProfile) {
        const chatSession = await createChatSession(userProfile, null, s.id, null, isPro);
        chatSession.conversationState = {
          ...defaultConversationState(),
          exchangeCount: Math.floor(msgs.length / 2),
          mode: msgs.length > 4 ? 'insight' : msgs.length > 2 ? 'orient' : 'intake',
        };
        setSession(chatSession);
      }
      setShowHistory(false);
      setTimeout(() => { if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight; }, 100);
    } catch (e) { console.error('Failed to switch session:', e); }
  };

  const deleteSession = async (sessionId) => {
    try {
      await ChatRepository.deleteSession(sessionId);
      setChatSessions(prev => prev.filter(s => s.id !== sessionId));
    } catch (e) { }
  };

  const scrollRef = useRef(null);
  const initialMessageSent = useRef(false);

  const [proactiveInsight, setProactiveInsight] = useState(null);
  const [narrativeCtx, setNarrativeCtx] = useState(null);

  const name = userProfile?.name?.split(' ')[0] || 'Stargazer';
  const sun = userProfile?.chart?.planets?.find(p => p.name === 'Sun');
  const moon = userProfile?.chart?.planets?.find(p => p.name === 'Moon');
  const rising = userProfile?.chart?.planets?.find(p => p.name === 'Ascendant');

  const ctxChips = [
    sun && `\u2609 ${sun.sign} Sun`,
    moon && `\u263d ${moon.sign} Moon`,
    rising && `\u2191 ${rising.sign} Rising`,
  ].filter(Boolean);

  const buildNarrativeGreeting = (ctx) => {
    if (!ctx) return "What's on your mind today?";
    const parts = [];
    if (ctx.season) {
      parts.push(`You're ${ctx.season.progress}% through your ${ctx.season.planet}-${ctx.season.natalTarget} season \u2014 ${ctx.season.description?.toLowerCase()}.`);
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
      const moonNote = moon ? `Your ${moon.sign} Moon is ${hour >= 20 ? 'wide awake right now' : 'processing beneath the surface'}.` : '';
      body = `${sun.sign} Sun${moon ? ` \u00b7 ${moon.sign} Moon` : ''}${rising ? ` \u00b7 ${rising.sign} Rising` : ''}. ${moonNote} What's on your mind?`;
    } else {
      body = 'What\'s on your mind tonight?';
    }

    return { id, role: 'model', text: `${timeGreet}, ${name} \u2726\n\n${body}`, timestamp: Date.now() };
  };

  // Initialize: load latest session history OR start fresh, then create AI session
  useEffect(() => {
    if (!userProfile) return;
    let transitCtx = null;
    try {
      const moonNow = getMoonDataForDate(new Date());
      transitCtx = {
        mercuryRx: false,
        moonPhase: moonNow?.phaseName || null,
      };
    } catch (e) { }

    setSuggestions(pickSuggestions([], userProfile, chatTheme, transitCtx));

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

    if (!loadedSessionId) {
      setMessages([greeting]);
    }

    try {
      const chatSession = await createChatSession(userProfile, null, loadedSessionId, ctx, isPro);
      chatSession.conversationState = defaultConversationState();
      if (loadedSessionId) {
        const histLen = chatSession.history?.length || 0;
        chatSession.conversationState.exchangeCount = Math.floor(histLen / 2);
        chatSession.conversationState.mode = histLen > 8 ? 'insight' : histLen > 4 ? 'orient' : 'intake';
      }
      setSession(chatSession);
    } catch (e) {
      console.error('Failed to create chat session:', e);
    }
  };

  // Handle initial message
  useEffect(() => {
    const initialMessage = initialMessageProp;
    if (initialMessage && !initialMessageSent.current && session && messages.length > 0 && !sending) {
      initialMessageSent.current = true;
      setTimeout(() => handleSend(initialMessage), 500);
    }
  }, [session, messages.length, initialMessageProp]);

  // Auto-scroll on new messages + refresh suggestions
  useEffect(() => {
    if (messages.length > 1) {
      setTimeout(() => {
        if (scrollRef.current) {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
      }, 100);
    }
    setSuggestions(pickSuggestions(messages, userProfile, chatTheme));
  }, [messages]);

  const startNewSession = async (theme = null) => {
    const activeTheme = theme || chatTheme;
    if (theme) setChatTheme(theme);
    const greeting = makeGreeting('greeting_new', narrativeCtx);
    setMessages([greeting]);
    initialMessageSent.current = false;

    try {
      const chatSession = await createChatSession(userProfile, null, null, narrativeCtx, isPro);
      chatSession.conversationState = defaultConversationState();
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

  const handleSend = async (textOverride) => {
    const text = (textOverride || inputText || '').trim();
    if (!text || sending) return;

    const FREE_DAILY_LIMIT = 5;
    if (!isPro) {
      try {
        const count = await ChatRepository.getUserMessageCountForDay(Date.now());
        const remaining = Math.max(0, FREE_DAILY_LIMIT - count);
        setRemainingMsgs(remaining);
        if (count >= FREE_DAILY_LIMIT) {
          setLimitReached(true);
          return;
        }
      } catch (e) {
        console.error('Failed to check message count:', e);
      }
    }

    setInputText('');

    const userMsg = { id: Date.now().toString(), role: 'user', text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);

    try {
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

      // Track engagement
      try { const { incrementCounter, awardXP } = await import('@/lib/engagementService'); incrementCounter('chats'); awardXP('chat_message'); } catch {}

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
    <div style={styles.wrap}>
      {/* Sticky top bar: X | ☽ Celestia | history | + new */}
      <div style={{
        display: 'flex', flexDirection: 'row', alignItems: 'center',
        paddingTop: 54, paddingLeft: 16, paddingRight: 16, paddingBottom: 8,
        backgroundColor: 'var(--c-bg)',
      }}>
        <button style={styles.dismissBtn} onClick={() => onClose?.()}>
          <X size={18} color={'var(--c-text)'} strokeWidth={2.5} />
        </button>
        <div style={{ ...styles.chatOrb, width: 30, height: 30, borderRadius: 15, marginLeft: 8 }}>
          <span style={{ fontSize: 15, color: '#C8A84B' }}>{'\u263d'}</span>
        </div>
        <span style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 16, color: 'var(--c-heading)', flex: 1, marginLeft: 8 }}>Celestia</span>
        {/* History icon */}
        <button
          onClick={loadChatHistory}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: 'var(--c-card-bg-alpha)', border: '1px solid var(--c-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', marginRight: 8,
          }}
        >
          <span style={{ fontSize: 15 }}>{'\ud83d\udd58'}</span>
        </button>
        {/* New chat + */}
        <button
          onClick={() => startNewSession()}
          style={{
            width: 34, height: 34, borderRadius: 17,
            backgroundColor: '#C8A84B', border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: 20, color: '#0E0E22', fontWeight: '300', marginTop: -1 }}>+</span>
        </button>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        style={styles.msgs}
        className="scroll-container"
      >
        {/* Greeting — only at start of new conversation */}
        {messages.length <= 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingTop: 20, paddingBottom: 10 }}>
            <div style={{ ...styles.chatOrb, width: 52, height: 52, borderRadius: 26, marginBottom: 10 }}>
              <span style={{ fontSize: 28, color: '#C8A84B' }}>{'\u263d'}</span>
            </div>
            <p style={{ fontFamily: 'var(--font-serif)', fontWeight: 500, fontSize: 18, color: 'var(--c-heading)', marginBottom: 2, margin: 0 }}>Celestia</p>
            <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', margin: 0 }}>
              {new Date().getHours() >= 22 || new Date().getHours() < 5 ? 'Night session' : new Date().getHours() >= 17 ? 'Evening session' : 'Always here'}
            </p>
          </div>
        )}

        {/* Proactive Insight Card */}
        {proactiveInsight && messages.length <= 2 && (
          <button
            style={styles.proactiveCard}
            onClick={() => {
              setProactiveInsight(null);
              handleSend(proactiveInsight.question);
            }}
          >
            <p style={styles.proactiveLabel}>COSMIC INSIGHT</p>
            <p style={styles.proactiveTitle}>{proactiveInsight.title}</p>
            <p style={styles.proactiveBody}>{proactiveInsight.body}</p>
            <p style={styles.proactiveCTA}>{'Tap to ask \u2192'}</p>
          </button>
        )}

        {messages.map((m, i) => (
          <div key={m.id || i}>
            <div style={{ ...styles.mrow, ...(m.role === 'user' ? styles.mrowUser : {}) }}>
              <div
                style={{
                  ...styles.morb,
                  background: m.role === 'model'
                    ? 'linear-gradient(135deg, #0E0E22, #1A1060)'
                    : 'linear-gradient(135deg, #E2C46A, #8C6C18)',
                }}
              >
                <span style={{ fontSize: 13, color: m.role === 'model' ? '#C8A84B' : 'white' }}>
                  {m.role === 'model' ? '\u263d' : name[0]?.toUpperCase()}
                </span>
              </div>
              <div style={{
                ...styles.mbub,
                ...(m.role === 'model' ? styles.mbubAi : styles.mbubUser),
              }}>
                <span style={{
                  ...styles.mbubText,
                  ...(m.role === 'user' ? { color: 'var(--c-heading)' } : { color: 'var(--c-text)' }),
                }}>
                  {m.role === 'model'
                    ? renderMarkdown(m.text, { ...styles.mbubText, color: 'var(--c-text)' })
                    : m.text}
                </span>
              </div>
            </div>
            <div style={{ ...styles.mtimeRow, ...(m.role === 'user' ? { flexDirection: 'row-reverse' } : {}) }}>
              <span style={styles.mtime}>{formatTime(m.timestamp)}</span>
              {m.role === 'model' && m.id !== 'greeting' && m.id !== 'greeting_new' && (
                <button style={styles.shareBtn} onClick={() => shareResponse(m.text)}>
                  <span style={styles.shareBtnText}>{'Share \u2197'}</span>
                </button>
              )}
            </div>
          </div>
        ))}

        {sending && (
          <div style={styles.mrow}>
            <div style={{ ...styles.morb, background: 'linear-gradient(135deg, #0E0E22, #1A1060)' }}>
              <span style={{ fontSize: 13, color: '#C8A84B' }}>{'\u263d'}</span>
            </div>
            <div style={styles.typingWrap}>
              <div style={styles.typingDots}>
                <span style={styles.typingDot} />
                <span style={{ ...styles.typingDot, animationDelay: '0.2s' }} />
                <span style={{ ...styles.typingDot, animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div style={{ paddingBottom: keyboardOffset > 0 ? 6 : bottomPadding, backgroundColor: 'var(--c-bg)', zIndex: 100, transform: keyboardOffset > 0 ? `translateY(-${keyboardOffset}px)` : 'none', transition: 'transform 0.15s ease-out' }}>
        {/* Suggestions */}
        <div style={styles.suggestStrip} className="scroll-container">
          <div style={{ display: 'flex', paddingLeft: 17, paddingRight: 17, gap: 7 }}>
            {suggestions.map((s, i) => (
              <button key={`${s}_${i}`} style={styles.schip} onClick={() => setInputText(s)}>
                <span style={styles.schipText}>{s}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Chat Theme Pills */}
        {messages.length === 0 && (
          <div style={{ display: 'flex', gap: 6, paddingLeft: 17, paddingRight: 17, marginBottom: 8 }}>
            {CHAT_THEMES.map((t) => (
              <button
                key={t.key}
                onClick={() => { setChatTheme(t.key); startNewSession(t.key); }}
                style={{
                  padding: '6px 12px', borderRadius: 100,
                  backgroundColor: chatTheme === t.key ? 'var(--c-gold-dim)' : 'var(--c-card-bg-alpha)',
                  border: chatTheme === t.key ? '1px solid rgba(200,168,75,0.3)' : '1px solid var(--c-border)',
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
                }}
              >
                <span style={{ fontSize: 12 }}>{t.icon}</span>
                <span style={{ fontSize: 11, fontWeight: chatTheme === t.key ? 600 : 400, color: chatTheme === t.key ? '#C8A84B' : 'var(--c-text-secondary)' }}>{t.label}</span>
              </button>
            ))}
          </div>
        )}

        {/* Remaining messages counter (free users only) */}
        {!isPro && remainingMsgs !== null && remainingMsgs <= 3 && remainingMsgs > 0 && (
          <div style={styles.limitBanner}>
            <span style={styles.limitText}>{remainingMsgs} {remainingMsgs === 1 ? 'message' : 'messages'} left today</span>
            <button onClick={() => {}}>
              <span style={styles.limitLink}>{'Go unlimited \u2192'}</span>
            </button>
          </div>
        )}

        {/* Input -- or gentle upgrade prompt when limit reached */}
        {limitReached ? (
          <div style={{ ...styles.inputBar, flexDirection: 'column', alignItems: 'center', gap: 10, paddingTop: 16, paddingBottom: 16 }}>
            <p style={{ fontFamily: 'var(--font-serif)', fontSize: 15, color: 'var(--c-heading)', textAlign: 'center', margin: 0 }}>
              You've explored 5 conversations today
            </p>
            <p style={{ fontSize: 12, color: 'var(--c-text-secondary)', textAlign: 'center', lineHeight: '18px', paddingLeft: 20, paddingRight: 20, margin: 0 }}>
              They reset at midnight. Or keep the conversation going now.
            </p>
            <button
              style={{ backgroundColor: 'var(--c-bg)', borderRadius: 100, paddingTop: 11, paddingBottom: 11, paddingLeft: 28, paddingRight: 28, marginTop: 4, border: '1px solid rgba(255,255,255,0.1)' }}
              onClick={() => {}}
            >
              <span style={{ fontFamily: 'var(--font-sans)', fontWeight: 500, fontSize: 13, color: 'var(--c-heading)' }}>{'Keep Chatting \u2192'}</span>
            </button>
          </div>
        ) : (
          <div style={styles.inputBar}>
            <div style={styles.inputField}>
              <textarea
                style={styles.inputTextStyle}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Ask the cosmos anything..."
                maxLength={500}
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
              />
            </div>
            <button
              style={{
                ...styles.sendBtn,
                opacity: (!inputText.trim() || sending) ? 0.5 : 1,
              }}
              onClick={() => handleSend()}
              disabled={sending || !inputText.trim()}
            >
              <span style={{ fontSize: 17, color: 'white' }}>{'\u2191'}</span>
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes typingBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.4; }
          40% { transform: translateY(-4px); opacity: 1; }
        }
      `}</style>

      {/* Chat History Panel */}
      {showHistory && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 200,
          display: 'flex', flexDirection: 'column',
          backgroundColor: 'var(--c-bg)',
          animation: 'slideInRight 0.25s ease-out',
        }}>
          {/* History Header */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '62px 20px 16px', borderBottom: '1px solid var(--c-border)',
          }}>
            <button onClick={() => setShowHistory(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <span style={{ fontSize: 18, color: 'var(--c-text-secondary)' }}>{'\u2190'}</span>
            </button>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 20, color: 'var(--c-heading)', flex: 1, textAlign: 'center' }}>Chat History</h2>
            <button onClick={() => { setShowHistory(false); startNewSession(); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
              <span style={{ fontSize: 13, color: '#C8A84B', fontWeight: 600 }}>+ New</span>
            </button>
          </div>

          {/* Session List */}
          <div className="scroll-container" style={{ flex: 1, padding: '12px 16px' }}>
            {chatSessions.length === 0 ? (
              <div style={{ textAlign: 'center', paddingTop: 80 }}>
                <span style={{ fontSize: 40, display: 'block', marginBottom: 12 }}>{'\u263d'}</span>
                <p style={{ fontFamily: 'var(--font-serif)', fontSize: 18, color: 'var(--c-heading)', marginBottom: 6 }}>No past conversations</p>
                <p style={{ fontSize: 13, color: 'var(--c-text-secondary)' }}>Start chatting and your history will appear here</p>
              </div>
            ) : (
              chatSessions.map((s, i) => {
                const date = new Date(s.lastUpdated || s.createdAt);
                const isToday = date.toDateString() === new Date().toDateString();
                const dateStr = isToday ? 'Today' : date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                return (
                  <div key={s.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '14px 12px', marginBottom: 6,
                    backgroundColor: 'var(--c-card-bg-alpha)',
                    border: '1px solid var(--c-border)',
                    borderRadius: 14, cursor: 'pointer',
                  }}>
                    <button onClick={() => switchToSession(s)} style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 12, background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
                      <div style={{
                        width: 38, height: 38, borderRadius: 19,
                        background: 'linear-gradient(135deg, rgba(200,168,75,0.15), rgba(200,168,75,0.05))',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                      }}>
                        <span style={{ fontSize: 16, color: '#C8A84B' }}>{'\u263d'}</span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--c-heading)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {s.title || 'Untitled chat'}
                        </p>
                        <p style={{ fontSize: 11, color: 'var(--c-text-secondary)', margin: '2px 0 0' }}>
                          {dateStr} {'\u00b7'} {timeStr}
                        </p>
                      </div>
                    </button>
                    <button onClick={() => { if (window.confirm('Delete this conversation?')) deleteSession(s.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6 }}>
                      <span style={{ fontSize: 14, color: 'var(--c-text-muted)' }}>{'\u2715'}</span>
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}

const styles = {
  wrap: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: 'var(--c-bg)',
  },
  header: {
    backgroundColor: 'var(--c-header-bg)',
    borderBottom: `1px solid ${'var(--c-border)'}`,
    paddingTop: 62,
    paddingLeft: 22,
    paddingRight: 22,
    paddingBottom: 13,
    backdropFilter: 'blur(20px)',
    WebkitBackdropFilter: 'blur(20px)',
  },
  aiRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    marginBottom: 11,
  },
  chatOrb: {
    width: 46,
    height: 46,
    borderRadius: 23,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #0E0E22, #1A1060)',
    boxShadow: '0 3px 12px rgba(14,14,34,0.22)',
  },
  aiName: {
    fontFamily: 'var(--font-serif)',
    fontSize: 20,
    color: 'var(--c-heading)',
    marginBottom: 1,
    margin: 0,
  },
  aiSub: {
    fontSize: 11,
    color: 'var(--c-text-secondary)',
    margin: 0,
  },
  dismissBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: `1px solid ${'var(--c-border)'}`,
    backgroundColor: 'var(--c-card-bg-alpha)',
    cursor: 'pointer',
    padding: 0,
  },
  newChatBtn: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderRadius: 100,
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 14,
    paddingRight: 14,
    border: `1px solid ${'var(--c-border)'}`,
    cursor: 'pointer',
  },
  newChatBtnText: {
    fontSize: 11,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    color: 'var(--c-text)',
  },
  msgs: {
    flex: 1,
    overflow: 'auto',
    paddingTop: 17,
    paddingBottom: 20,
    paddingLeft: 17,
    paddingRight: 17,
    display: 'flex',
    flexDirection: 'column',
    gap: 15,
  },
  mrow: {
    display: 'flex',
    flexDirection: 'row',
    gap: 9,
  },
  mrowUser: {
    flexDirection: 'row-reverse',
  },
  morb: {
    width: 28,
    height: 28,
    borderRadius: 14,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 3,
    flexShrink: 0,
  },
  mbub: {
    maxWidth: '73%',
    borderRadius: 18,
    padding: 11,
    paddingLeft: 14,
    paddingRight: 14,
  },
  mbubAi: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderBottomLeftRadius: 5,
  },
  mbubUser: {
    backgroundColor: 'var(--c-bg)',
    borderBottomRightRadius: 5,
    border: '1px solid rgba(255,255,255,0.1)',
  },
  mbubText: {
    fontSize: 13.5,
    lineHeight: '22px',
    color: 'var(--c-text)',
    whiteSpace: 'pre-wrap',
  },
  mtime: {
    fontSize: 10,
    color: 'var(--c-text-muted)',
  },
  typingWrap: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    borderRadius: 18,
    borderBottomLeftRadius: 5,
    padding: 12,
    paddingLeft: 16,
    paddingRight: 16,
  },
  typingDots: {
    display: 'flex',
    gap: 4,
    alignItems: 'center',
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'var(--c-text-secondary)',
    display: 'inline-block',
    animation: 'typingBounce 1.4s infinite ease-in-out',
  },
  suggestStrip: {
    flexGrow: 0,
    paddingTop: 7,
    paddingBottom: 7,
    overflow: 'auto',
    WebkitOverflowScrolling: 'touch',
  },
  schip: {
    backgroundColor: 'var(--c-card-bg-alpha)',
    border: `1px solid ${'var(--c-border)'}`,
    borderRadius: 100,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 14,
    paddingRight: 14,
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    flexShrink: 0,
  },
  schipText: {
    fontSize: 12,
    color: 'var(--c-text)',
  },
  inputBar: {
    paddingLeft: 17,
    paddingRight: 17,
    paddingTop: 9,
    paddingBottom: 28,
    backgroundColor: 'var(--c-bg)',
    borderTop: `1px solid ${'var(--c-border)'}`,
    display: 'flex',
    flexDirection: 'row',
    gap: 9,
    alignItems: 'flex-end',
  },
  inputField: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    backgroundColor: 'var(--c-input-bg)',
    border: `1.5px solid ${'var(--c-input-border)'}`,
    borderRadius: 24,
    paddingLeft: 17,
    paddingRight: 17,
    display: 'flex',
    alignItems: 'center',
  },
  inputTextStyle: {
    fontSize: 14,
    color: 'var(--c-text)',
    paddingTop: 12,
    paddingBottom: 12,
    width: '100%',
    background: 'none',
    border: 'none',
    outline: 'none',
    fontFamily: 'var(--font-sans)',
    resize: 'none',
    lineHeight: '22px',
  },
  sendBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'var(--c-bg)',
    border: '1px solid rgba(255,255,255,0.1)',
    boxShadow: '0 3px 12px rgba(14,14,34,0.22)',
    cursor: 'pointer',
    flexShrink: 0,
  },
  // Proactive insight
  proactiveCard: {
    backgroundColor: 'rgba(107,92,165,0.12)',
    border: '1px solid rgba(107,92,165,0.25)',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    cursor: 'pointer',
    textAlign: 'left',
    width: '100%',
    display: 'block',
  },
  proactiveLabel: {
    fontSize: 8,
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    letterSpacing: 1.5,
    color: '#B0A0E0',
    marginBottom: 6,
    margin: '0 0 6px 0',
  },
  proactiveTitle: {
    fontFamily: 'var(--font-serif)',
    fontSize: 16,
    color: 'var(--c-heading)',
    marginBottom: 4,
    margin: '0 0 4px 0',
  },
  proactiveBody: {
    fontSize: 13,
    color: 'var(--c-text-secondary)',
    lineHeight: '19px',
    marginBottom: 8,
    margin: '0 0 8px 0',
  },
  proactiveCTA: {
    fontSize: 11,
    fontFamily: 'var(--font-sans)',
    fontWeight: 600,
    color: '#B0A0E0',
    margin: 0,
  },
  // Message time + share row
  mtimeRow: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
    paddingLeft: 4,
    paddingRight: 4,
  },
  shareBtn: {
    paddingTop: 2,
    paddingBottom: 2,
    paddingLeft: 6,
    paddingRight: 6,
    background: 'none',
    border: 'none',
    cursor: 'pointer',
  },
  shareBtnText: {
    fontSize: 10,
    color: T.gold,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
  },
  // Limit banner
  limitBanner: {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingTop: 6,
    paddingBottom: 6,
    backgroundColor: 'rgba(200,168,75,0.08)',
    borderTop: '1px solid rgba(200,168,75,0.15)',
  },
  limitText: {
    fontSize: 11,
    color: 'var(--c-text-secondary)',
  },
  limitLink: {
    fontSize: 11,
    fontFamily: 'var(--font-sans)',
    fontWeight: 500,
    color: T.gold,
  },
};
