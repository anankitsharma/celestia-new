// ─────────────────────────────────────────────────────────────────────────────
// CELESTIA CONVERSATION STATE UPDATER
// Ported from web: services/geminiService.ts (updateConversationState, detectOpenerMove)
// ─────────────────────────────────────────────────────────────────────────────

import { GoogleGenAI } from "@google/genai";

const API_KEY = "AIzaSyDmaZykGA8m8suXCpCPy0vKPFCRLvrfhNo";
const ai = new GoogleGenAI({ apiKey: API_KEY });

/**
 * Detects which toolkit move opened the assistant response (for anti-formulaic tracking).
 * @param {string} response
 * @returns {import('./conversationTypes').ToolkitMove|null}
 */
export const detectOpenerMove = (response) => {
  const first = response.slice(0, 150).toLowerCase();

  // Mirror openers — reflects their feelings/situation
  if (first.match(/^(i hear|that feeling|that kind of|that sense|that makes sense|yeah|you're not|you're right|no,? you're)/)) return 'MIRROR';
  // Chart anchor openers — leads with chart/astrology
  if (first.match(/^(your (venus|mars|moon|saturn|jupiter|mercury|sun|neptune|pluto|chart|rising))/)) return 'CHART_ANCHOR';
  if (first.match(/^(okay so|so here's|here's what)/)) return 'CHART_ANCHOR';
  // Callback openers — references previous conversation
  if (first.match(/^(remember|how'?s|how did|last time|you mentioned|we talked)/)) return 'CALLBACK';
  // Nudge openers — provocation or question
  if (first.match(/^(can i ask|let me ask|real talk|honestly|here's what i want)/)) return 'NUDGE';
  // Reframe openers
  if (first.match(/^(nothing('?s| is) wrong|you're not (broken|stupid|dumb)|that's not)/)) return 'REFRAME';
  // Shadow openers
  if (first.match(/^(the (hard|tricky|honest|difficult) part|here's the part you)/)) return 'SHADOW';
  // Future window openers
  if (first.match(/^(the good news|what's coming|in the next|by |starting )/)) return 'FUTURE_WINDOW';
  // Pattern name openers
  if (first.match(/^(the pattern|because you're wired|this keeps happening because)/)) return 'PATTERN_NAME';

  return null;
};

/**
 * Updates conversation state after each exchange.
 * Enhanced with three-tier memory: names, life events, knowledge level, opener tracking.
 * Runs as a fast async call — does not block the response.
 *
 * @param {import('./conversationTypes').ConversationState} currentState
 * @param {string} userMessage
 * @param {string} assistantResponse
 * @param {import('./conversationTypes').IntentType} intent
 * @param {import('./conversationTypes').ConversationDepth} depth
 * @param {import('./conversationTypes').EmotionalState} emotionalState
 * @returns {Promise<import('./conversationTypes').ConversationState>}
 */
export const updateConversationState = async (currentState, userMessage, assistantResponse, intent, depth, emotionalState) => {
  // Detect which toolkit move opened this response (for anti-formulaic tracking)
  const lastOpener = detectOpenerMove(assistantResponse);

  try {
    if (!API_KEY) throw new Error('no key');

    const updatePrompt = `You are a conversation state tracker for an astrology chat system. Extract ALL relevant information.

User said: "${userMessage}"
Astrologer responded: "${assistantResponse.slice(0, 500)}..."

Current state:
- Central theme: ${currentState.centralTheme || 'unknown'}
- Covered topics: ${currentState.coveredTopics.join(', ') || 'none'}
- User revealed facts: ${currentState.userRevealedFacts.join('; ') || 'none'}
- Known names: ${currentState.knownNames.join(', ') || 'none'}
- Key life events: ${currentState.keyLifeEvents.join('; ') || 'none'}

Extract updates as JSON:
{
  "centralTheme": "short phrase describing the main theme (or keep existing)",
  "newTopics": ["new astrological topics covered, e.g. 'venus_placement', 'saturn_return'"],
  "newFacts": ["new personal facts revealed, e.g. 'recent breakup', 'unhappy at work'"],
  "endingQuestion": "the exact ending question asked (or empty string)",
  "newNames": ["any names of people mentioned: 'Jake', 'Sarah', 'my mom' — first names or relationship labels"],
  "newLifeEvents": ["significant life events mentioned: 'just got promoted', 'broke up last week', 'starting new job'"],
  "knowledgeLevel": "beginner|intermediate|advanced — based on how they talk about astrology (beginner=no terms, intermediate=knows big 3, advanced=discusses aspects/houses)",
  "communicationPreference": "depth|quick|unknown — do they want deep analysis or quick answers?"
}

Only output valid JSON. Keep strings short and lowercase where possible.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-lite',
      contents: updatePrompt,
    });

    const text = (response.candidates?.[0]?.content?.parts?.[0]?.text || '').trim();
    const clean = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    const updates = JSON.parse(clean);

    // Determine new mode
    const newCount = currentState.exchangeCount + 1;
    let newMode = currentState.mode;
    if (newCount <= 2) newMode = 'intake';
    else if (newCount <= 4) newMode = 'orient';
    else if (depth >= 2) newMode = 'insight';
    else if (depth >= 3) newMode = 'integrate';

    return {
      ...currentState,
      exchangeCount: newCount,
      depth,
      emotionalState,
      mode: newMode,
      lastIntent: intent,
      lastOpener,
      centralTheme: updates.centralTheme || currentState.centralTheme,
      coveredTopics: [...new Set([...currentState.coveredTopics, ...(updates.newTopics || [])])],
      userRevealedFacts: [...new Set([...currentState.userRevealedFacts, ...(updates.newFacts || [])])],
      askedQuestions: updates.endingQuestion
        ? [...currentState.askedQuestions.slice(-4), updates.endingQuestion]
        : currentState.askedQuestions,
      // Three-tier memory enrichment
      knownNames: [...new Set([...currentState.knownNames, ...(updates.newNames || [])])],
      keyLifeEvents: [...new Set([...currentState.keyLifeEvents, ...(updates.newLifeEvents || [])])],
      knowledgeLevel: updates.knowledgeLevel && updates.knowledgeLevel !== 'unknown'
        ? updates.knowledgeLevel
        : currentState.knowledgeLevel,
      communicationPreference: updates.communicationPreference && updates.communicationPreference !== 'unknown'
        ? updates.communicationPreference
        : currentState.communicationPreference,
    };
  } catch {
    // If state update fails, still track opener and increment count
    return {
      ...currentState,
      exchangeCount: currentState.exchangeCount + 1,
      depth,
      emotionalState,
      lastIntent: intent,
      lastOpener,
    };
  }
};
