// ─────────────────────────────────────────────────────────────────────────────
// CELESTIA INTENT CLASSIFIER & EMOTIONAL SIGNAL DETECTOR
// Ported from web: services/geminiService.ts (classifyIntent, detectEmotionalSignals)
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIza-OLD-KEY-REMOVED-FROM-HISTORY";
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Detects nuanced emotional state from message signals (typing patterns, tone, content).
 * Richer than basic intent classification — reads between the lines.
 * @param {string} msg - Raw user message
 * @returns {{ emotionalState: import('./conversationTypes').EmotionalState, isLateNight: boolean }}
 */
export const detectEmotionalSignals = (msg) => {
  const lower = msg.toLowerCase().trim();
  const isLateNight = false; // Caller sets based on actual time

  // Self-deprecation / shame → needs immediate reframe
  if (lower.match(/i'?m so (dumb|stupid|pathetic|worthless)|what'?s wrong with me|i'?m the problem|i always mess|i'?m such an idiot/)) {
    return { emotionalState: 'distressed', isLateNight };
  }

  // Anger / frustration → match energy, don't calm down
  if (lower.match(/men are trash|i'?m (so )?(pissed|furious|angry|frustrated|done with)|sick of|can'?t stand|so unfair|bullshit|wtf/)) {
    return { emotionalState: 'angry', isLateNight };
  }

  // Guarded / one-word → testing trust, don't push
  if (lower.length < 8 && lower.match(/^(yeah|idk|maybe|sure|ok|meh|fine|whatever|i guess)\.?$/)) {
    return { emotionalState: 'guarded', isLateNight };
  }

  // Deflecting with humor — "lol" while discussing pain
  if (lower.includes('lol') && lower.match(/hurt|sad|cry|pain|broke|miss|alone|left me/)) {
    return { emotionalState: 'deflecting', isLateNight };
  }

  // Excited / hopeful — high energy
  if (lower.match(/omg|oh my god|!!|i'?m so excited|this is amazing|guess what|i can'?t believe|best thing|so happy/)) {
    return { emotionalState: 'excited', isLateNight };
  }

  // Hopeful but anxious — question about a specific person
  if (lower.match(/is he|is she|are we compatible|his birthday|her birthday|do you think he|do you think she/)) {
    return { emotionalState: 'anxious', isLateNight };
  }

  // Anxious — lots of questions or seeking control
  if ((lower.match(/\?/g) || []).length >= 3) {
    return { emotionalState: 'anxious', isLateNight };
  }

  // Processing — long, rambling messages
  if (lower.length > 200) {
    return { emotionalState: 'processing', isLateNight };
  }

  // Sad / defeated — short, lowercase, no punctuation
  if (lower.length < 60 && lower === msg.trim() && !msg.match(/[.!?]$/) && lower.match(/feel|stuck|tired|empty|lost|numb|heavy|drained|exhausted/)) {
    return { emotionalState: 'sad', isLateNight };
  }

  // Curious — uses astrology terms
  if (lower.match(/my (venus|mars|moon|saturn|jupiter|mercury|neptune|pluto|uranus|rising|ascendant|midheaven|north node)/)) {
    return { emotionalState: 'curious', isLateNight };
  }

  return { emotionalState: 'unknown', isLateNight };
};

/**
 * Classifies the intent of a user message using fast rule-based detection + AI fallback.
 * Enhanced with nuanced emotional detection (reads between the lines).
 * @param {string} userMessage
 * @param {import('./conversationTypes').ConversationState} conversationState
 * @returns {Promise<{ intent: import('./conversationTypes').IntentType, depth: import('./conversationTypes').ConversationDepth, emotionalState: import('./conversationTypes').EmotionalState }>}
 */
export const classifyIntent = async (userMessage, conversationState) => {
  const exchangeCount = conversationState.exchangeCount;
  const msg = userMessage.toLowerCase().trim();

  // Detect emotional signals first (enriches all classification paths)
  const { emotionalState: detectedEmotion } = detectEmotionalSignals(userMessage);

  // Emotional dump signals — check FIRST before any length-based heuristics
  if (msg.match(/heartbroken|devastated|i'?m lost|falling apart|don'?t know what to do|i'?m done|can'?t take|crying|sobbing|depressed|anxious|scared|terrified|so confused|i hate myself|what'?s wrong with me|help me|i'?m broken|i give up|i can'?t|falling apart|overwhelmed|drowning|i want to die|nothing matters|what'?s the point|i'?m hurting/)) {
    return { intent: 'EMOTIONAL_DUMP', depth: conversationState.depth, emotionalState: 'distressed' };
  }

  // Self-deprecation is also emotional dump territory
  if (msg.match(/i'?m so (dumb|stupid|pathetic|worthless)|i always ruin|i'?m the worst/)) {
    return { intent: 'EMOTIONAL_DUMP', depth: conversationState.depth, emotionalState: 'distressed' };
  }

  // Open invitation signals
  if (msg.match(/^(hi|hello|hey|what do you see|tell me about my chart|read my chart|where do i start|what should i ask|what can you tell me)[\.\?\!]?$/) ||
    msg.match(/tell me (everything|about my chart|what you see)/)) {
    return { intent: 'OPEN_INVITATION', depth: 1, emotionalState: 'curious' };
  }

  // Short follow-up signals — only after ruling out emotional content
  if (msg.length < 30 && (
    msg.match(/^(yes|yeah|yep|no|nope|ok|okay|sure|really|wow|hm|hmm|go on|tell me more|keep going|and\??|so\??|right|exactly|that'?s it|that'?s me|omg|oh|ah|interesting|continue|makes sense|i see|got it|wait|what|huh)[\.\!\?]?$/) ||
    msg.length < 12
  )) {
    const emotion = detectedEmotion !== 'unknown' ? detectedEmotion : 'open';
    return { intent: 'FOLLOW_UP', depth: Math.min(conversationState.depth + 1, 3), emotionalState: emotion };
  }

  // AI classification for complex messages
  try {
    if (!API_KEY) throw new Error('no key');

    const classifyPrompt = `Classify this astrology chat message into exactly one category.

User message: "${userMessage}"
Conversation exchange count so far: ${exchangeCount}

Categories:
- EMOTIONAL_DUMP: Raw emotional pain, distress, overwhelm, self-deprecation, shame — needs human acknowledgment first
- OPEN_INVITATION: Vague opener, "tell me about my chart", testing the waters, sharing life context
- PATTERN_QUESTION: Asking why they keep doing/experiencing something recurring
- PLACEMENT_QUESTION: Asking what a specific planet, house, or sign means for them
- TRANSIT_QUESTION: Asking about current transits, timing, "why does everything feel hard right now"
- DECISION_QUESTION: Asking whether to do something, whether a relationship is right, timing a decision
- FOLLOW_UP: Short reply, agreement, "tell me more", continuing a thread

Also estimate:
- depth: 1 (surface, first exchanges), 2 (engaged, sharing real things), 3 (deeply open, vulnerable)
- emotionalState: distressed | sad | anxious | angry | hopeful | excited | guarded | deflecting | processing | curious | open | unknown

Read between the lines — "idk i just feel stuck" is sad/defeated, "lol he left me on read" is deflecting, lots of questions = anxious.

Respond with only valid JSON: {"intent": "CATEGORY", "depth": 1, "emotionalState": "state"}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: classifyPrompt,
    });

    const text = (response.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const parsed = JSON.parse(clean);

    // Prefer rule-based emotional detection when it found something specific
    const finalEmotion = detectedEmotion !== 'unknown' ? detectedEmotion : (parsed.emotionalState || 'unknown');

    return {
      intent: parsed.intent,
      depth: parsed.depth || conversationState.depth,
      emotionalState: finalEmotion,
    };
  } catch {
    // Fallback heuristics
    if (msg.includes('why do i keep') || msg.includes('why does this keep') || msg.includes('pattern') || msg.includes('always end up')) {
      return { intent: 'PATTERN_QUESTION', depth: conversationState.depth, emotionalState: detectedEmotion !== 'unknown' ? detectedEmotion : 'curious' };
    }
    if (msg.includes('what does my') || msg.includes('my venus') || msg.includes('my moon') || msg.includes('my saturn') || msg.includes('house')) {
      return { intent: 'PLACEMENT_QUESTION', depth: conversationState.depth, emotionalState: detectedEmotion !== 'unknown' ? detectedEmotion : 'curious' };
    }
    if (msg.includes('transit') || msg.includes('saturn return') || msg.includes('retrograde') || msg.includes('why does everything') || msg.includes('right now')) {
      return { intent: 'TRANSIT_QUESTION', depth: conversationState.depth, emotionalState: detectedEmotion !== 'unknown' ? detectedEmotion : 'curious' };
    }
    if (msg.includes('should i') || msg.includes('worth it') || msg.includes('right time') || msg.includes('is he') || msg.includes('is she')) {
      return { intent: 'DECISION_QUESTION', depth: conversationState.depth, emotionalState: detectedEmotion !== 'unknown' ? detectedEmotion : 'anxious' };
    }
    return { intent: 'PATTERN_QUESTION', depth: conversationState.depth, emotionalState: detectedEmotion !== 'unknown' ? detectedEmotion : 'unknown' };
  }
};
