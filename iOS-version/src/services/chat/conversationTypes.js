// ─────────────────────────────────────────────────────────────────────────────
// CELESTIA CONVERSATION INTELLIGENCE — Types & Defaults
// Ported from web: modules/chat/types.ts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * The 7 intent types a user message can fall into.
 * @typedef {'EMOTIONAL_DUMP'|'OPEN_INVITATION'|'PATTERN_QUESTION'|'PLACEMENT_QUESTION'|'TRANSIT_QUESTION'|'DECISION_QUESTION'|'FOLLOW_UP'} IntentType
 */

/**
 * Conversation depth — how far the person has opened up.
 * 1 = surface, 2 = engaged, 3 = deep
 * @typedef {1|2|3} ConversationDepth
 */

/**
 * The conversation mode — the arc of the session.
 * @typedef {'intake'|'orient'|'insight'|'integrate'|'expand'|'close'} ConversationMode
 */

/**
 * Emotional state of the user across the conversation.
 * @typedef {'distressed'|'sad'|'anxious'|'angry'|'hopeful'|'excited'|'guarded'|'deflecting'|'processing'|'curious'|'open'|'unknown'} EmotionalState
 */

/**
 * The 8 adaptive toolkit moves (replaces rigid 4-beat).
 * @typedef {'MIRROR'|'PATTERN_NAME'|'CHART_ANCHOR'|'SHADOW'|'REFRAME'|'FUTURE_WINDOW'|'CALLBACK'|'NUDGE'} ToolkitMove
 */

/**
 * Live conversation state — built up and updated after each exchange.
 * @typedef {Object} ConversationState
 * @property {ConversationDepth} depth
 * @property {ConversationMode} mode
 * @property {EmotionalState} emotionalState
 * @property {string|null} centralTheme
 * @property {string[]} coveredTopics
 * @property {string[]} userRevealedFacts
 * @property {string[]} askedQuestions
 * @property {IntentType|null} lastIntent
 * @property {number} exchangeCount
 * @property {ToolkitMove|null} lastOpener
 * @property {string[]} knownNames
 * @property {'beginner'|'intermediate'|'advanced'} knowledgeLevel
 * @property {string[]} keyLifeEvents
 * @property {'depth'|'quick'|'unknown'} communicationPreference
 */

/**
 * Creates a fresh default conversation state.
 * @returns {ConversationState}
 */
export const defaultConversationState = () => ({
  depth: 1,
  mode: 'intake',
  emotionalState: 'unknown',
  centralTheme: null,
  coveredTopics: [],
  userRevealedFacts: [],
  askedQuestions: [],
  lastIntent: null,
  exchangeCount: 0,
  lastOpener: null,
  knownNames: [],
  knowledgeLevel: 'beginner',
  keyLifeEvents: [],
  communicationPreference: 'unknown',
});
