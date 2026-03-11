import { GoogleGenAI, HarmBlockThreshold, HarmCategory, Type } from "@google/genai";
// types imported as needed
import { calculateDailyLoveScore } from "./astrologyService";
import { ChatRepository } from "./database/rep_chats";
import { ForecastRepository } from "./database/rep_forecasts";
import { ReportRepository } from "./database/rep_reports";

// API Key (Use ENV in production)
const API_KEY = "AIzaSyDmaZykGA8m8suXCpCPy0vKPFCRLvrfhNo";
const ai = new GoogleGenAI({ apiKey: API_KEY });
const MODELS = ['gemini-2.5-flash-lite', 'gemini-2.5-flash', 'gemini-3-flash-preview'];

// --- SAFETY SETTINGS ---
const SAFETY_SETTINGS = [
    {
        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
];

// --- SCHEMAS ---

const periodSchema = {
    type: Type.OBJECT,
    properties: {
        header: { type: Type.STRING },
        powerCosmic: { type: Type.STRING },
        luckyStats: {
            type: Type.OBJECT,
            properties: {
                number: { type: Type.INTEGER },
                color: { type: Type.STRING },
                colorHex: { type: Type.STRING },
                crystal: { type: Type.STRING },
            },
            required: ["number", "color", "colorHex", "crystal"]
        },
        mantra: { type: Type.STRING },
        detailedHoroscope: { type: Type.STRING },
        loveVibe: { type: Type.STRING },
        careerVibe: { type: Type.STRING },
        actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
        viralInsight: { type: Type.STRING },

        // Extended Fields
        loveArchetype: { type: Type.STRING },
        loveHoroscope: { type: Type.STRING },
        loveActions: { type: Type.ARRAY, items: { type: Type.STRING } },
        careerArchetype: { type: Type.STRING },
        careerHoroscope: { type: Type.STRING },
        careerActions: { type: Type.ARRAY, items: { type: Type.STRING } },
        careerPowerSource: { type: Type.STRING },
        wealthFlow: { type: Type.STRING },
        marketTiming: { type: Type.STRING },
        planetInfluences: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { glyph: { type: Type.STRING }, tag: { type: Type.STRING }, effect: { type: Type.STRING } }, required: ["glyph", "tag", "effect"] } },
        dailyRitual: { type: Type.STRING }
    },
    required: ["header", "powerCosmic", "luckyStats", "mantra", "detailedHoroscope", "loveVibe", "careerVibe", "actionItems", "viralInsight", "loveArchetype", "loveHoroscope", "loveActions", "careerArchetype", "careerHoroscope", "careerActions", "careerPowerSource", "wealthFlow", "marketTiming", "planetInfluences", "dailyRitual"]
};

const reportCoreSchema = {
    type: Type.OBJECT,
    properties: {
        synthesis: { type: Type.STRING },
        lifeAreasOverview: { type: Type.STRING },
        energyBalance: {
            type: Type.OBJECT,
            properties: {
                overallTone: { type: Type.STRING },
                elementEmphasis: { type: Type.STRING },
                movementStyle: { type: Type.STRING },
                whyItMatters: { type: Type.STRING }
            },
            required: ["overallTone", "elementEmphasis", "movementStyle", "whyItMatters"]
        }
    },
    required: ["synthesis", "lifeAreasOverview", "energyBalance"]
};

const journalReportSchema = {
    type: Type.OBJECT,
    properties: {
        hook: { type: Type.STRING, description: "Lived Experience - Start with something they've felt. Max 20 words." },
        definition: { type: Type.STRING, description: "Life Arena - What this house/planet represents. Max 25 words." },
        traits: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "3-4 Behavioral Bullets. 'You...' statements. Concrete, psychological. Max 15 words each."
        },
        share_quote: { type: Type.STRING, description: "Identity-Safe Share Line. First person 'I need...' or 'My relationships...'. Viral & Short." }
    },
    required: ["hook", "definition", "traits", "share_quote"]
};

const evolutionaryPathSchema = {
    type: Type.OBJECT,
    properties: {
        familiarPattern: { type: Type.STRING },
        growthDirection: { type: Type.STRING },
        integrationInsight: { type: Type.STRING }
    },
    required: ["familiarPattern", "growthDirection", "integrationInsight"]
};

const aspectAnalysisSchema = {
    type: Type.ARRAY,
    items: { type: Type.STRING },
};

const transitInsightSchema = {
    type: Type.OBJECT,
    properties: {
        personalMeaning: { type: Type.STRING, description: "What this transit means FOR THEM specifically, referencing their natal placement. 2-3 sentences, max 60 words." },
        houseActivation: { type: Type.STRING, description: "Which life area (house) is being activated and how it manifests. 1-2 sentences, max 40 words." },
        doThis: { type: Type.STRING, description: "One concrete action to take today. Max 15 words." },
        avoidThis: { type: Type.STRING, description: "One thing to be mindful of. Max 15 words." },
        ritual: { type: Type.STRING, description: "A short micro-ritual or spiritual practice aligned with this transit. Max 20 words." },
        ritualDuration: { type: Type.STRING, description: "How long the ritual takes. E.g. '2 min', '5 min'." },
    },
    required: ["personalMeaning", "houseActivation", "doThis", "avoidThis", "ritual", "ritualDuration"]
};

const mercuryRxSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING, description: "A short personal headline for this retrograde. Max 8 words. E.g. 'Your words need a second look'" },
        explanation: { type: Type.STRING, description: "What Mercury retrograde in this sign means specifically for THIS person's natal chart. Reference their Mercury sign, house, and any natal aspects being activated. 3-4 sentences, max 80 words." },
        tips: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    icon: { type: Type.STRING, description: "A single emoji representing this tip" },
                    text: { type: Type.STRING, description: "A personalized survival tip based on their chart. Max 20 words." },
                },
                required: ["icon", "text"]
            },
            description: "4 personalized survival tips based on how this retrograde hits their specific chart"
        },
        chartImpact: { type: Type.STRING, description: "Which specific houses and planets in their chart are most activated by this retrograde. 2-3 sentences, max 60 words." },
        hiddenGift: { type: Type.STRING, description: "The positive opportunity or silver lining of this retrograde for their chart. 1-2 sentences, max 40 words." },
        ritual: { type: Type.STRING, description: "A personalized micro-ritual for surviving this retrograde. Max 20 words." },
    },
    required: ["headline", "explanation", "tips", "chartImpact", "hiddenGift", "ritual"]
};

const aspectDeepDiveSchema = {
    type: Type.OBJECT,
    properties: {
        hook: { type: Type.STRING, description: "What this aspect FEELS like in daily life. Max 20 words." },
        dynamic: { type: Type.STRING, description: "How these two planets interact — the push-pull or harmony. 2-3 sentences, max 60 words." },
        strength: { type: Type.STRING, description: "The gift or superpower this aspect gives. 1-2 sentences, max 30 words." },
        challenge: { type: Type.STRING, description: "The tension or shadow side to watch for. 1-2 sentences, max 30 words." },
        advice: { type: Type.STRING, description: "Practical, action-oriented guidance. Max 20 words." },
        share_quote: { type: Type.STRING, description: "Instagram-ready first-person statement. Max 15 words." }
    },
    required: ["hook", "dynamic", "strength", "challenge", "advice", "share_quote"]
};

const houseDeepDiveSchema = {
    type: Type.OBJECT,
    properties: {
        hook: { type: Type.STRING, description: "What this house FEELS like for them. Max 20 words." },
        meaning: { type: Type.STRING, description: "What this house governs in their life. 2-3 sentences, max 60 words." },
        signInfluence: { type: Type.STRING, description: "How the sign on the cusp colors this house. 2-3 sentences, max 60 words." },
        planetsInfluence: { type: Type.STRING, description: "How planets in this house shape experience. 2-3 sentences. If no planets, say 'This house is unoccupied — its themes play out through the ruling sign.' Max 60 words." },
        lifeLesson: { type: Type.STRING, description: "The deeper lesson or growth area. 1-2 sentences, max 30 words." },
        share_quote: { type: Type.STRING, description: "Instagram-ready first-person statement. Max 15 words." }
    },
    required: ["hook", "meaning", "signInfluence", "planetsInfluence", "lifeLesson", "share_quote"]
};

const relationshipForecastSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING },
        vibe: { type: Type.STRING },
        do: { type: Type.STRING },
        dont: { type: Type.STRING },
        cosmicFocus: { type: Type.STRING }
    },
    required: ["headline", "vibe", "do", "dont", "cosmicFocus"]
};

const chatSchema = {
    type: Type.OBJECT,
    properties: {
        response: { type: Type.STRING },
        followUpQuestions: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
        }
    },
    required: ["response", "followUpQuestions"]
};

const dailyLetterSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING },
        content: { type: Type.STRING },
    },
    required: ["headline", "content"],
};

const fullReportSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        summary: { type: Type.STRING },
        sections: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    heading: { type: Type.STRING },
                    body: { type: Type.STRING },
                    remedy: { type: Type.STRING },
                    affirmation: { type: Type.STRING },
                },
                required: ["heading", "body"]
            }
        },
        keyInsight: { type: Type.STRING },
    },
    required: ["title", "summary", "sections", "keyInsight"]
};

const deepPdfReportSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING, description: "3-6 word archetypal title, e.g. 'The Architect of Inner Worlds'" },
        coreMotif: { type: Type.STRING, description: "One profound sentence capturing the soul's theme" },
        overview: { type: Type.STRING, description: "4 paragraphs separated by \\n\\n: chart synthesis, tensions, gifts, mission. ~400 words total." },
        bigThree: {
            type: Type.OBJECT,
            properties: {
                sun: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "e.g. 'Virgo Sun: The Sacred Craftsperson'" },
                        interpretation: { type: Type.STRING, description: "2-3 paragraphs, ~200 words" },
                        shadow: { type: Type.STRING, description: "1 paragraph on the shadow side, ~60 words" },
                        advice: { type: Type.STRING, description: "1 practical sentence" },
                    },
                    required: ["title", "interpretation", "shadow", "advice"]
                },
                moon: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        interpretation: { type: Type.STRING },
                        shadow: { type: Type.STRING },
                        advice: { type: Type.STRING },
                    },
                    required: ["title", "interpretation", "shadow", "advice"]
                },
                rising: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING },
                        interpretation: { type: Type.STRING },
                        shadow: { type: Type.STRING },
                        advice: { type: Type.STRING },
                    },
                    required: ["title", "interpretation", "shadow", "advice"]
                },
            },
            required: ["sun", "moon", "rising"]
        },
        planets: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING },
                    placement: { type: Type.STRING, description: "e.g. 'Sagittarius in the 9th house'" },
                    title: { type: Type.STRING, description: "e.g. 'Sagittarius Mercury: The Cosmic Explorer'" },
                    interpretation: { type: Type.STRING, description: "2 paragraphs for inner planets (Mercury-Saturn), 1 paragraph for outer (Uranus-Pluto)" },
                    advice: { type: Type.STRING },
                },
                required: ["name", "placement", "title", "interpretation", "advice"]
            },
            description: "8 planets: Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto"
        },
        lifeAreas: {
            type: Type.OBJECT,
            properties: {
                love: {
                    type: Type.OBJECT,
                    properties: {
                        theme: { type: Type.STRING, description: "3-4 word theme" },
                        analysis: { type: Type.STRING, description: "2-3 paragraphs, ~200 words" },
                        advice: { type: Type.STRING },
                    },
                    required: ["theme", "analysis", "advice"]
                },
                career: {
                    type: Type.OBJECT,
                    properties: { theme: { type: Type.STRING }, analysis: { type: Type.STRING }, advice: { type: Type.STRING } },
                    required: ["theme", "analysis", "advice"]
                },
                purpose: {
                    type: Type.OBJECT,
                    properties: { theme: { type: Type.STRING }, analysis: { type: Type.STRING }, advice: { type: Type.STRING } },
                    required: ["theme", "analysis", "advice"]
                },
                challenge: {
                    type: Type.OBJECT,
                    properties: { theme: { type: Type.STRING }, analysis: { type: Type.STRING }, advice: { type: Type.STRING } },
                    required: ["theme", "analysis", "advice"]
                },
            },
            required: ["love", "career", "purpose", "challenge"]
        },
        soulPath: {
            type: Type.OBJECT,
            properties: {
                northNodeMessage: { type: Type.STRING, description: "2 paragraphs on evolutionary direction" },
                karmicPatterns: { type: Type.STRING, description: "1-2 paragraphs on South Node patterns to release" },
                giftToTheWorld: { type: Type.STRING, description: "1 inspiring paragraph" },
            },
            required: ["northNodeMessage", "karmicPatterns", "giftToTheWorld"]
        },
        elementalBalance: {
            type: Type.OBJECT,
            properties: {
                dominantElement: { type: Type.STRING },
                dominantModality: { type: Type.STRING },
                analysis: { type: Type.STRING, description: "2 paragraphs on temperament implications" },
            },
            required: ["dominantElement", "dominantModality", "analysis"]
        },
        closing: { type: Type.STRING, description: "2 inspiring paragraphs weaving all themes into empowerment, ~150 words" },
    },
    required: ["headline", "coreMotif", "overview", "bigThree", "planets", "lifeAreas", "soulPath", "elementalBalance", "closing"]
};


// --- HELPERS ---

const getISOWeekLabel = (date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() + 4 - (d.getDay() || 7));
    const year = d.getFullYear();
    const week = Math.ceil((((d.getTime() - new Date(year, 0, 1).getTime()) / 86400000) + 1) / 7);
    return `${year}-W${week.toString().padStart(2, '0')}`;
};

const cleanAndParseJson = (text, fallback) => {
    if (!text) return fallback;
    try {
        let cleaned = text.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end >= start) {
            return JSON.parse(cleaned.substring(start, end + 1));
        }
        return fallback;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        return fallback;
    }
};

const withRetry = async (
    operation,
    fallbackValue
) => {
    let attempts = 0;
    while (attempts < 3) {
        try {
            return await operation();
        } catch (error) {
            console.error(`Attempt ${attempts + 1} failed:`, error);
            if (error.message?.includes('503') || error.message?.includes('429')) {
                attempts++;
                await new Promise(resolve => setTimeout(resolve, 1000 * attempts));
                continue;
            }
            break;
        }
    }
    return fallbackValue;
};

const generateWithFallback = async (params) => {
    let lastError;
    for (const model of MODELS) {
        try {
            const result = await ai.models.generateContent({
                ...params,
                model: model,
                config: {
                    ...params.config,
                    safetySettings: SAFETY_SETTINGS,
                }
            });
            return result;
        } catch (e) {
            console.warn(`Model ${model} failed:`, e.message);
            lastError = e;
        }
    }
    throw lastError;
};

// --- MONTHLY RECAP ---

const monthlyRecapSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING },
        summary: { type: Type.STRING },
        topInsight: { type: Type.STRING },
        cosmicScore: { type: Type.INTEGER },
        lookAhead: { type: Type.STRING },
    },
    required: ["headline", "summary", "topInsight", "cosmicScore", "lookAhead"]
};

export const generateMonthlyRecap = async (astralSignature, stats) => {
    const prompt = `Generate a monthly cosmic recap for this user.

USER'S CHART: ${astralSignature}

STATS THIS MONTH:
- Days active: ${stats.daysActive || 0}
- Journal entries written: ${stats.journalEntries || 0}
- Longest streak: ${stats.longestStreak || 0}
- Top insight from their readings: ${stats.topInsight || 'N/A'}

Generate:
1. HEADLINE: A 4-6 word poetic summary of their cosmic month. Examples: "The month you chose clarity", "Quiet revolutions took root", "Your Venus woke up"
2. SUMMARY: 2 sentences. What the cosmos brought them this month. Reference their chart. Max 40 words.
3. TOP INSIGHT: The single most important thing they learned or experienced cosmically. 1 sentence, max 20 words.
4. COSMIC SCORE: 1-100. Based on transit activity for their chart this month.
5. LOOK AHEAD: 1 sentence preview of next month's energy. Max 20 words.

TONE: Warm, personal, reflective. Like a wise friend reviewing the month together.
NEVER: Generic platitudes, emoji, "the universe", "stars align".`;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: monthlyRecapSchema }
        });
        return cleanAndParseJson(response.text, null);
    }, null);
};

// --- MOON RITUAL ---

const moonRitualSchema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        opening: { type: Type.STRING },
        prompts: { type: Type.ARRAY, items: { type: Type.STRING } },
        affirmation: { type: Type.STRING },
        closingRitual: { type: Type.STRING },
    },
    required: ["title", "opening", "prompts", "affirmation", "closingRitual"]
};

export const generateMoonRitual = async (moonData, astralSignature, isNewMoon) => {
    const phase = isNewMoon ? 'New Moon' : 'Full Moon';
    const intent = isNewMoon ? 'setting intentions for what you want to manifest' : 'reflecting on what has come to fruition and releasing what no longer serves you';

    const prompt = `You are a gentle, wise astrology guide creating a personal ${phase} ritual.

${phase} in ${moonData.sign} — ${moonData.illumination}% illumination.
User's chart: ${astralSignature}
${moonData.majorAspect ? `Moon Aspect: ${moonData.majorAspect.label} (${moonData.majorAspect.type})` : ''}

Create a personal ${phase} ritual focused on ${intent}.

TITLE: A poetic 3-5 word ritual name. Examples: "Seeds in Dark Soil" (New Moon), "Harvest of Light" (Full Moon).

OPENING: 2-3 sentences setting the scene. Reference the Moon's sign and the user's chart. Intimate, not generic. Max 50 words.

PROMPTS: ${isNewMoon ? '3 intention-setting journal prompts' : '3 reflection + release journal prompts'}. Each must be:
- A question or "I..." statement
- Personal to their chart placements
- Max 20 words each
${isNewMoon ? 'Examples: "What am I ready to call in for my Scorpio Moon?", "I plant the seed of ___.", "What would I do if fear wasn\'t a factor?"' :
'Examples: "What has the Full Moon illuminated that I was hiding from?", "I release ___.", "What truth have I been avoiding?"'}

AFFIRMATION: One powerful sentence. Personal to their placements. Max 15 words.

CLOSING RITUAL: A simple physical ritual (lighting candle, writing and burning, placing crystal, etc.). 2 sentences, max 30 words.

TONE: Intimate, gentle, grounded. Not fluffy. Like a wise friend, not a guru.

NEVER: Generic spiritual platitudes, "manifest your dreams", "trust the universe", emoji.`;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: moonRitualSchema }
        });
        return cleanAndParseJson(response.text, null);
    }, null);
};

// --- COSMIC NOTIFICATION LINES ---

const cosmicLineBatchSchema = {
    type: Type.OBJECT,
    properties: {
        lines: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    date: { type: Type.STRING },
                    title: { type: Type.STRING },
                    body: { type: Type.STRING },
                },
                required: ["date", "title", "body"]
            }
        }
    },
    required: ["lines"]
};

export const generateCosmicNotificationBatch = async (astralSignature, dayContexts) => {
    const dayBlocks = dayContexts.map(d => {
        const moonLine = `Moon: ${d.moonData.phaseName} in ${d.moonData.sign} (${d.moonData.illumination}% illumination)`;
        const aspectLine = d.moonData.majorAspect ? `Moon Aspect: ${d.moonData.majorAspect.label} (${d.moonData.majorAspect.type})` : '';
        const keyTransits = d.transits
            .filter(t => ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(t.name))
            .map(t => `${t.name} in ${t.sign}${t.isRetrograde ? ' Rx' : ''}`)
            .join(', ');
        const windows = d.cosmicWindows.length > 0
            ? `Active Windows: ${d.cosmicWindows.map(w => w.description).join('; ')}`
            : '';
        const rxLine = d.mercuryRx ? 'Mercury Retrograde is ACTIVE' : '';

        return `--- ${d.date} ---\n${moonLine}\n${aspectLine}\nKey Transits: ${keyTransits}\n${windows}\n${rxLine}`.replace(/\n{2,}/g, '\n').trim();
    }).join('\n\n');

    const prompt = `You are the notification writer for Celestia, a premium astrology app.

Your ONLY goal: make the user TAP the notification and open the app.

Generate ${dayContexts.length} daily morning notifications — one per day.

USER'S NATAL CHART:
${astralSignature}

DAILY COSMIC WEATHER:
${dayBlocks}

THE STRATEGY — CURIOSITY GAPS:
Every notification must create an OPEN LOOP. Reveal something specific and personal, but withhold the payoff so the user MUST tap to complete it. The notification is a teaser, not the content.

STRUCTURE: title (hook) + body (specific tease + soft CTA)

TITLE RULES:
- Max 5 words, no emoji
- Creates intrigue or urgency. Examples:
  "Something shifted overnight"
  "Check your Venus today"
  "This only happens twice"
  "Not what you expected"
  "Before noon. Read this."

BODY RULES:
- 2 parts: (1) a specific, personal astrology tease, then (2) a soft call-to-action
- Max 25 words total
- The tease MUST reference their placements or real transits
- The CTA pulls them into the app — never says "open the app" directly

HIGH-IMPACT BODY EXAMPLES (study these closely):
  "Mars crossed your natal Venus overnight. Your love score shifted — see what changed."
  "Your Scorpio Moon is being activated by a rare transit. Full reading is ready."
  "Mercury Rx hits your 3rd house differently. We mapped how — check your chart."
  "3 planets are touching your natal placements right now. See which ones."
  "The Moon enters your Rising sign in 4 hours. Your energy forecast updated."
  "Something in your career sector just turned on. Your daily reading explains it."
  "Jupiter is doing something unusual to your Sun placement. Worth a look."

SOFT CTA PATTERNS (rotate these — never repeat in a batch):
- "See what changed."
- "Full reading is ready."
- "Check your chart."
- "See which ones."
- "Your forecast updated."
- "Worth a look."
- "We broke it down."
- "Your reading explains it."
- "See how it lands."

TONE (vary across the batch):
- Urgent: "Before noon. Read this." / "Mars crossed your natal Venus overnight."
- Mysterious: "Something shifted in your chart." / "3 planets are doing something unusual."
- Personal: "Your Pisces Moon is being activated." / "This transit only hits your sign this way."
- Specific: "Venus enters your Moon sign at 2pm." / "Saturn square your Mercury — we mapped it."
- Provocative: "You might feel off today." / "There is a reason. Your chart has the answer."

WHAT MAKES USERS TAP:
- Specificity ("3 planets", "your natal Venus", "your 7th house") — feels like the app knows something
- Incompleteness ("shifted", "something unusual", "see what changed") — the notification is not enough
- Time sensitivity ("overnight", "before noon", "in 4 hours") — creates urgency
- Numbers ("3 planets", "love score shifted", "happens twice") — concrete = credible
- Soft CTA that promises a payoff inside the app

CRITICAL — WHAT THE USER WILL SEE WHEN THEY OPEN THE APP:
The notification MUST ONLY reference things the user can verify in the app. The app shows:
- Moon phase + sign (displayed in hero section)
- Mercury Retrograde status (banner if active)
- Cosmic Windows: transits hitting their natal chart (shown as cards)
- Daily forecast: AI-generated reading with header, power cosmic, mantra
- Energy grid: Love / Career / Health scores (percentage bars)
- Love & Career vibes (3-word descriptors)
- Planet positions strip (Sun through Pluto with signs + degrees)

DO NOT reference things the app does not show:
- Specific house numbers (the app does not display house activations on the Today tab)
- Specific degree numbers or orbs
- Timing like "at 2pm" or "in 4 hours" (the app does not show transit times)

GOOD references (visible in app):
- Moon sign/phase ("Moon in Scorpio", "Full Moon")
- Energy scores ("love energy shifted", "career score")
- Cosmic windows ("Mars touching your natal Venus")
- Mercury retrograde status
- Planet signs ("Venus in Aries", "Mars Rx")
- Forecast reading ("your reading", "daily forecast")

NEVER:
- Generic language ("stars align", "trust the universe", "good vibes", "cosmic energy")
- Emoji anywhere
- Starting with "Today" or "The cosmos" or "Good morning"
- Self-contained wisdom (if they feel complete after reading, they won't tap)
- Hard CTA ("Open the app", "Tap here", "Click now")
- Same CTA pattern twice in the batch
- More than 25 words in body
- Same sentence structure repeated across days`;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: {
                responseMimeType: "application/json",
                responseSchema: cosmicLineBatchSchema,
            }
        });
        const data = cleanAndParseJson(response.text, null);
        if (!data?.lines || !Array.isArray(data.lines) || data.lines.length === 0) return null;

        // Validate: discard lines that are too long
        return data.lines.filter(line =>
            line.date && line.title && line.body &&
            line.title.split(' ').length <= 6 &&
            line.body.split(' ').length <= 30
        );
    }, null);
};

// --- EXPORTS ---

export const generateReportOverview = async (profile) => {
    const cacheKey = `${profile.id}_natal_core`;
    const cached = await ReportRepository.getReport(cacheKey);
    if (cached) return cached;

    const fallback = {
        headline: "The Cosmic Alignment",
        synthesis: "Your chart reveals a unique blend of energies.\n\nThis balance brings you strength.",
        lifeAreasOverview: "You are likely to focus on personal growth.",
        energyBalance: {
            overallTone: "Balanced",
            elementEmphasis: "Mixed",
            movementStyle: "Steady",
            whyItMatters: "Balance is key."
        }
    };

    const chartSummary = JSON.stringify(profile.chart?.planets || []);
    const prompt = `
        User: ${profile.name}
        Chart: ${chartSummary}
        Generate Core Report.
        Requirements: Headline, Synthesis (3 paragraphs), LifeAreas, EnergyBalance.
        Tone: Simple, Professional, Grade 6-7.
        Return JSON.
        `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: reportCoreSchema }
        });
        const data = cleanAndParseJson(response.text, fallback);
        await ReportRepository.saveReport(cacheKey, profile.id, 'natal', data, 'core');
        return data;
    }, fallback);
};

export const generateEvolutionaryPath = async (nnSign, nnHouse, snSign, snHouse) => {
    // Generic Trait Generation (No Profile Persistence required for now, using direct API)
    const fallback = {
        familiarPattern: "Familiarity with routine.",
        growthDirection: "Growth towards new experiences.",
        integrationInsight: "Balance both worlds."
    };

    const prompt = `Analyze Nodes: NN ${nnSign} (H${nnHouse}), SN ${snSign} (H${snHouse}). 
    Tone: Mystical but SIMPLE. Grade 6-7 English.
    JSON Only.`;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: evolutionaryPathSchema }
        });
        return cleanAndParseJson(response.text, fallback);
    }, fallback);
};

export const generateAspectAnalysis = async (aspects) => {
    // Generic Trait Generation
    const fallback = {};
    const inputList = aspects.map((a, i) => `${i}: ${a}`).join('\n');
    const prompt = `List of aspects:\n${inputList}\nWrite ONE short sentence for each. 
    Tone: Simple, Action-Oriented advice. Grade 6-7 English.
    JSON Array.`;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: aspectAnalysisSchema }
        });
        const list = cleanAndParseJson(response.text, []);
        return list.reduce((acc, text, index) => {
            acc[String(index)] = text;
            return acc;
        }, {});
    }, fallback);
};

export const generatePlacementDeepDive = async (planet, sign, house, profileId) => {
    // If no profileId, we cannot use the DB cache because of Foreign Key constraints (profile_id must exist).
    // In that case, we skip the DB check and just return the AI generation (or use an in-memory cache if we added one).
    const key = profileId ? `${profileId}_planet_v2_${planet}_${sign}_${house} ` : null;

    // Check Cache (Type: 'planet_deep_dive')
    if (key) {
        const cached = await ForecastRepository.getForecast(key);
        if (cached) return cached;
    }

    const fallback = {
        hook: "You feel this energy deeply in your daily life.",
        definition: "This placement represents your core drive for this area of life.",
        traits: [
            "You often take the lead in this area.",
            "You value authenticity over tradition.",
            "You need freedom to express this energy."
        ],
        share_quote: "I need to be myself to feel alive."
    };

    const prompt = `
        ACT AS: A Psychological Astrologer for Gen Z.
        TOPIC: ${planet} in ${sign} (House ${house}).

        GOAL: Write a PERSONAL "Journal Entry" style insight.
        
        TONE RULES:
        - psychological, not magical.
        - "You may feel..." NOT "You will...".
        - Focus on LIVED EXPERIENCE and EMOTIONAL REALITY.
        - No jargon. Grade 6 English level.
        - Warm, validating, "It's okay to be this way".

        STRUCTURE (JSON):
        1. hook: One sentence that validates a specific feeling they have. (e.g., "You often feel like...").
        2. definition: Briefly explain what this part of life IS about (e.g., "The 7th House is where we mirror ourselves...").
        3. traits: 3 distinct, punchy bullet points about their BEHAVIOR.
        4. share_quote: A short, aesthetic "I statement" they would post on Instagram. (e.g., "I don't chase, I attract.").

        JSON Only.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: journalReportSchema }
        });
        const data = cleanAndParseJson(response.text, fallback);
        // Cache for 30 days if we have a valid profile
        if (profileId && key) {
            await ForecastRepository.saveForecast(key, profileId, 'planet_deep_dive', new Date().toISOString().split('T')[0], data, Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        return data;
    }, fallback);
};

export const generateAspectDeepDive = async (planet1, planet2, aspectType, orb, profileId) => {
    const key = profileId ? `${profileId}_aspect_v1_${planet1}_${planet2}_${aspectType}` : null;

    if (key) {
        const cached = await ForecastRepository.getForecast(key);
        if (cached) return cached;
    }

    const fallback = {
        hook: "This aspect shapes how two parts of your psyche interact.",
        dynamic: "These planets create a dialogue within you — sometimes harmonious, sometimes tense.",
        strength: "This gives you a unique ability to navigate complexity.",
        challenge: "Watch for moments when these energies pull in opposite directions.",
        advice: "Lean into awareness when this tension arises.",
        share_quote: "I contain multitudes and that's my power."
    };

    const aspectNature = ['Trine', 'Sextile'].includes(aspectType) ? 'flowing/harmonious'
        : ['Square', 'Opposition'].includes(aspectType) ? 'tense/challenging'
        : 'intensifying/fusing';

    const prompt = `
        ACT AS: A Psychological Astrologer for Gen Z.
        TOPIC: ${planet1} ${aspectType} ${planet2} (orb: ${orb}°) in a natal chart.

        CONTEXT: This is a ${aspectNature} aspect. The orb is ${parseFloat(orb) < 2 ? 'very tight — strongly felt' : parseFloat(orb) < 5 ? 'moderate — clearly present' : 'wide — subtly felt'}.

        GOAL: Explain how this aspect manifests as LIVED EXPERIENCE.

        TONE RULES:
        - Psychological, not magical. Focus on inner life and behavior.
        - "You may notice..." NOT "You will...".
        - No jargon. Grade 6 English.
        - Warm, insightful, validating.

        STRUCTURE (JSON):
        1. hook: What this aspect FEELS like day-to-day.
        2. dynamic: The conversation between these two planets — what each wants, how they negotiate.
        3. strength: The superpower or gift this aspect gives.
        4. challenge: The shadow side or tension to be aware of.
        5. advice: One practical thing they can do.
        6. share_quote: A first-person "I" statement for social sharing.

        JSON Only.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: aspectDeepDiveSchema }
        });
        const data = cleanAndParseJson(response.text, fallback);
        if (profileId && key) {
            await ForecastRepository.saveForecast(key, profileId, 'aspect_deep_dive', new Date().toISOString().split('T')[0], data, Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        return data;
    }, fallback);
};

export const generateHouseDeepDive = async (houseNumber, sign, planets, profileId) => {
    const key = profileId ? `${profileId}_house_v1_${houseNumber}_${sign}` : null;

    if (key) {
        const cached = await ForecastRepository.getForecast(key);
        if (cached) return cached;
    }

    const fallback = {
        hook: "This area of life holds important lessons for you.",
        meaning: "This house represents a core domain of your lived experience.",
        signInfluence: "The sign on the cusp colors how you approach this area of life.",
        planetsInfluence: planets.length > 0
            ? "The planets here add energy and focus to this life domain."
            : "This house is unoccupied — its themes play out through the ruling sign.",
        lifeLesson: "Growth comes through embracing this area with awareness.",
        share_quote: "I'm learning to honor every part of my story."
    };

    const planetDesc = planets.length > 0
        ? `Planets in this house: ${planets.map(p => `${p.name} in ${p.sign}`).join(', ')}.`
        : 'No planets occupy this house.';

    const prompt = `
        ACT AS: A Psychological Astrologer for Gen Z.
        TOPIC: House ${houseNumber} with ${sign} on the cusp in a natal chart.
        ${planetDesc}

        GOAL: Explain how this house manifests as LIVED EXPERIENCE.

        TONE RULES:
        - Psychological, not magical. Focus on real-life themes.
        - "You may find..." NOT "You will...".
        - No jargon. Grade 6 English.
        - Warm, insightful, validating.

        STRUCTURE (JSON):
        1. hook: What this house FEELS like in their daily life.
        2. meaning: What this house governs — the life domain in plain language.
        3. signInfluence: How ${sign} specifically colors how they experience this house.
        4. planetsInfluence: How the planets (or lack thereof) shape the experience. ${planets.length === 0 ? 'Say this house is unoccupied and the ruling sign drives the themes.' : ''}
        5. lifeLesson: The deeper growth opportunity this house offers.
        6. share_quote: A first-person "I" statement for social sharing.

        JSON Only.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: houseDeepDiveSchema }
        });
        const data = cleanAndParseJson(response.text, fallback);
        if (profileId && key) {
            await ForecastRepository.saveForecast(key, profileId, 'house_deep_dive', new Date().toISOString().split('T')[0], data, Date.now() + 30 * 24 * 60 * 60 * 1000);
        }
        return data;
    }, fallback);
};

export const generateTransitInsight = async (transitPlanet, transitSign, natalPlanet, natalSign, natalHouse, aspectType, orb, profileId) => {
    const dateLabel = new Date().toISOString().split('T')[0];
    const key = profileId ? `${profileId}_transit_v1_${dateLabel}_${transitPlanet}_${natalPlanet}_${aspectType}` : null;

    if (key) {
        const cached = await ForecastRepository.getForecast(key);
        if (cached) return cached;
    }

    const fallback = {
        personalMeaning: `Transit ${transitPlanet} is activating your natal ${natalPlanet} in ${natalSign}. Pay attention to shifts in this area of your life.`,
        houseActivation: natalHouse ? `Your ${natalHouse}th house themes are highlighted — expect movement in this life domain.` : 'Multiple life areas may feel this energy.',
        doThis: 'Take a moment to reflect on what this area of life needs from you.',
        avoidThis: 'Avoid making impulsive decisions under this transit.',
        ritual: 'Close your eyes for 2 minutes and visualize calm, grounding energy.',
        ritualDuration: '2 min',
    };

    const prompt = `
        ACT AS: A Psychological Astrologer giving personalized transit guidance.
        TRANSIT: ${transitPlanet} in ${transitSign} is making a ${aspectType} (orb: ${orb}°) to their natal ${natalPlanet} in ${natalSign}${natalHouse ? ` (House ${natalHouse})` : ''}.

        CONTEXT: This is a LIVE transit happening today. The orb is ${parseFloat(orb) < 2 ? 'very tight — strongly felt right now' : parseFloat(orb) < 5 ? 'moderate — clearly active' : 'wide — building or fading'}.
        ${['Square', 'Opposition'].includes(aspectType) ? 'This is a challenging aspect — focus on growth through tension.' : ['Trine', 'Sextile'].includes(aspectType) ? 'This is a flowing aspect — focus on opportunities.' : 'This is a conjunction — focus on intensification and new beginnings.'}

        GOAL: Explain what this transit means for THEM personally — not generic astrology.

        TONE: Warm, practical, Grade 6 English. No jargon. "You may notice..." not "You will...".

        STRUCTURE (JSON):
        1. personalMeaning: What this transit means for them specifically, referencing their natal ${natalPlanet} in ${natalSign}.
        2. houseActivation: Which life area (house ${natalHouse || 'unknown'}) is being lit up and what that looks like day-to-day.
        3. doThis: One specific, practical action they should take.
        4. avoidThis: One thing to be mindful of or avoid.
        5. ritual: A short micro-ritual or spiritual practice aligned with this transit energy. Examples: "Write 3 gratitudes under moonlight", "Carry citrine in your left pocket today", "Breathe deeply for 2 minutes visualizing gold light". Max 20 words.
        6. ritualDuration: How long it takes (e.g. "2 min", "5 min").

        JSON Only.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: transitInsightSchema }
        });
        const data = cleanAndParseJson(response.text, fallback);
        if (profileId && key) {
            // Cache for 24 hours (transits change daily)
            await ForecastRepository.saveForecast(key, profileId, 'transit_insight', dateLabel, data, Date.now() + 24 * 60 * 60 * 1000);
        }
        return data;
    }, fallback);
};

export const generateMercuryRxInsight = async (profile, mercurySign, mercuryDegree) => {
    const profileId = profile?.id || 'default';
    const key = `${profileId}_mercury_rx_${mercurySign}_${new Date().toISOString().slice(0, 7)}`;

    const cached = await ForecastRepository.getForecast(key);
    if (cached) return cached;

    const fallback = {
        headline: 'Mercury asks you to slow down',
        explanation: `Mercury retrograde in ${mercurySign} is activating parts of your chart related to communication and mental processing. Pay extra attention to how you express yourself during this period.`,
        tips: [
            { icon: '📱', text: 'Back up your devices — tech glitches are likely' },
            { icon: '📝', text: 'Double-check all messages before sending' },
            { icon: '🔄', text: 'Revisit old projects instead of starting new ones' },
            { icon: '🧘', text: 'Practice patience — delays are redirections' },
        ],
        chartImpact: `Mercury retrograde in ${mercurySign} highlights themes of review and reconsideration in your chart.`,
        hiddenGift: 'Use this time to reconnect with people and ideas from your past.',
        ritual: 'Write down 3 unfinished things and choose one to complete this week.',
    };

    const astralSig = getAstralSignature(profile);
    const natalMercury = profile?.chart?.planets?.find(p => p.name === 'Mercury');
    const natalMercuryInfo = natalMercury ? `Natal Mercury: ${natalMercury.sign} ${natalMercury.degree?.toFixed(0) || ''}° (House ${natalMercury.house || 'unknown'})` : '';

    const prompt = `
        ACT AS: A psychological astrologer giving a PERSONALIZED Mercury Retrograde survival guide.

        CURRENT TRANSIT: Mercury is RETROGRADE in ${mercurySign} at ${mercuryDegree}°.

        USER'S NATAL CHART:
        ${astralSig}
        ${natalMercuryInfo}
        Full planet list: ${profile?.chart?.planets?.map(p => `${p.name}: ${p.sign} ${p.degree?.toFixed(0) || 0}° House ${p.house || '?'}`).join(', ') || 'Unknown'}

        TASK: Generate a PERSONALIZED Mercury retrograde reading. DO NOT give generic advice.
        - Reference THEIR specific Mercury placement and how it interacts with the retrograde.
        - Reference which HOUSES in their chart are being activated.
        - Tips must be specific to their chart — e.g. if their natal Venus is in the retrograde sign, mention relationship communication specifically.

        TONE: Warm, practical, reassuring. Grade 6 English. Not scary — retrogrades are natural.

        JSON Only. Follow schema strictly.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: mercuryRxSchema }
        });
        const data = cleanAndParseJson(response.text, fallback);
        // Cache for the duration of this retrograde period (~3 weeks, use 30 days)
        await ForecastRepository.saveForecast(key, profileId, 'mercury_rx', new Date().toISOString().split('T')[0], data, Date.now() + 30 * 24 * 60 * 60 * 1000);
        return data;
    }, fallback);
};

export const fetchExtendedForecast = async (
    profile,
    period: 'today' | 'yesterday' | 'tomorrow' | 'weekly' | 'monthly' | 'yearly',
    planetaryData,
    transitSignificance = 0
) => {
    // Use the actual forecast date from planetaryData, not always "now"
    const forecastDate = planetaryData?.dateLabel || new Date().toISOString().split('T')[0];
    let key = `${profile.id}_${period}_${forecastDate}`;
    let expiration = Date.now() + 24 * 60 * 60 * 1000;

    if (period === 'weekly') {
        const week = getISOWeekLabel(new Date());
        key = `${profile.id}_weekly_${week}`;
        // Expire at end of current week (next Monday midnight)
        const now = new Date();
        const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
        const nextMonday = new Date(now.getFullYear(), now.getMonth(), now.getDate() + daysUntilMonday);
        expiration = nextMonday.getTime();
    } else if (period === 'monthly') {
        const month = new Date().toISOString().slice(0, 7);
        key = `${profile.id}_monthly_${month}`;
        // Expire at start of next month
        const now = new Date();
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        expiration = nextMonth.getTime();
    } else if (period === 'yearly') {
        const year = new Date().getFullYear();
        key = `${profile.id}_yearly_${year}`;
        // Expire at start of next year
        expiration = new Date(year + 1, 0, 1).getTime();
    }

    // Cosmic Download days get a separate cache key for extended content
    if ((period === 'today' || period === 'tomorrow' || period === 'yesterday') && transitSignificance >= 70) {
        key = `${profile.id}_${period}_cosmic_download_${forecastDate}`;
    }

    const cached = await ForecastRepository.getForecast(key);
    if (cached) return cached;

    const fallback = {
        header: "Cosmic Overview",
        powerCosmic: "Steady",
        luckyStats: { number: 7, color: "#FFFFFF" },
        mantra: "I am grounded.",
        detailedHoroscope: "The stars align.",
        loveVibe: "Harmony.",
        careerVibe: "Focus.",
        actionItems: ["Breathe", "Focus"],
        viralInsight: "The universe has your back.",
        loveNatal: { mandate: "", content: "", keywords: [] },
        careerNatal: { mandate: "", content: "", keywords: [] }
    };

    // Calculate Love Context (Simplified for brevity but functionally present)
    let loveContext = "";
    if (period === 'today' || period === 'tomorrow' || period === 'yesterday') {
        const targetDate = new Date(forecastDate);
        if (profile.chart) {
            const loveData = calculateDailyLoveScore(profile.chart, targetDate);
            loveContext = `Love Score: ${loveData.score} `;
        }
    }

    const astralSig = getAstralSignature(profile);

    // Differentiate Prompt Intensity
    const isDaily = period === 'today' || period === 'tomorrow' || period === 'yesterday';

    // "Quad Structure" for Daily: 4 Distinct Paragraphs (~200 words)
    let deepDiveInstruction = `4. DetailedHoroscope: A cohesive overview of the ${period}.3 sentences. (Max 50 words).`;

    const isCosmicDownload = isDaily && transitSignificance >= 70;

    if (isDaily && isCosmicDownload) {
        deepDiveInstruction = `4. DetailedHoroscope: THIS IS A COSMIC DOWNLOAD DAY (significance: ${transitSignificance}/100). Multiple major transits are activating this user's chart simultaneously. You MUST write exactly 6 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Opening): Why today is cosmically significant. Set the scene with urgency. (Max 60 words).
           - Para 2(Transit Breakdown): Name each active transit and what it means for their chart. Be specific. (Max 70 words).
           - Para 3(The Emotional Layer): How they will FEEL today. Be visceral and specific. (Max 60 words).
           - Para 4(The Opportunity): What becomes possible ONLY during this window. (Max 50 words).
           - Para 5(The Shadow): What to watch for — the risk of this much energy at once. (Max 50 words).
           - Para 6(The Integration): How to harness this energy. Specific, actionable. End with a powerful sentence. (Max 60 words).
           TOTAL length should be ~320-350 words. This is a DEEP reading — the most detailed of any day. Write like this moment matters.`;
    } else if (isDaily) {
        deepDiveInstruction = `4. DetailedHoroscope: You MUST write exactly 4 distinct paragraphs separated by "\\n\\n".
           - Para 1(Cosmic Climate): The general planetary atmosphere / mood today. (Max 50 words).
           - Para 2(Personal Impact): How it hits their specific chart(Sun / Moon). (Max 50 words).
           - Para 3(The Challenge): Shadows or friction points to avoid. (Max 50 words).
           - Para 4(The Guidance): Strategic advice and spiritual outcome. (Max 50 words).
           TOTAL length should be ~180 - 200 words.Deep, detailed, and rich.`;
    } else if (period === 'weekly') {
        deepDiveInstruction = `4. DetailedHoroscope: You MUST write exactly 4 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Weekly Arc): The main theme / lesson of the week. (Max 60 words).
           - Para 2(Mon - Wed): Early week energy and specific focus. (Max 60 words).
           - Para 3(Thu - Fri): The mid - week shift or turning point. (Max 60 words).
           - Para 4(The Weekend): Restoration, social mood, and love. (Max 60 words).
           TOTAL length ~240 words.Chronological flow.Grade 6 - 7 English.`;
    } else if (period === 'monthly') {
        deepDiveInstruction = `4. DetailedHoroscope: You MUST write exactly 4 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Theme): The major energetic signature of the month. (Max 55 words).
           - Para 2(First Half - Weeks 1 - 2): Initiation energy.What starts now ? (Max 55 words).
    - Para 3(Second Half - Weeks 3 - 4): Release and integration energy. (Max 55 words).
           - Para 4(Power Dates): List specific dates or windows for luck / action. (Max 55 words).
           TOTAL length ~220 words.Strategic Roadmap.Grade 6 - 7 English.`;
    } else if (period === 'yearly') {
        deepDiveInstruction = `4. DetailedHoroscope: You MUST write exactly 5 distinct paragraphs separated by "\\n\\n".
           - Para 1(Annual Theme): The "Big Picture" or major headline for the year. (Max 60 words).
           - Para 2(Q1 Jan - Mar): The Initiation Phase.How the year starts. (Max 60 words).
           - Para 3(Mid - Year Apr - Sep): The Growth / Work Phase.Major retrogrades or shifts. (Max 60 words).
           - Para 4(Q4 Oct - Dec): The Harvest Phase.How the year closes. (Max 60 words).
           - Para 5(Soul Lesson): One final spiritual sentence summing up the evolution. (Max 40 words).
           TOTAL length ~280 - 300 words.The "Magnum Opus" of forecasts.Grade 6 - 7 English.`;
    }

    const prompt = `
        ASTROLOGICAL FORECAST: ${period.toUpperCase()}.
    Date: ${planetaryData.dateLabel}.

        USER PROFILE:
        ${astralSig}
        ${loveContext}

        CURRENT TRANSITS(The Weather): 
        ${JSON.stringify(planetaryData)}

    TASK:
        Generate a premium, detailed forecast for this user.

        STRICT FORMATTING RULES:
    1. Header: Max 4 words(e.g. "Moon in Taurus").
        2. PowerCosmic: Max 3 words(e.g. "Grounded Energy").
        3. Mantra: A simple affirmation(Max 10 words).
        ${deepDiveInstruction}
    5. LoveVibe: Max 3 words(Adjective + Noun).
        6. CareerVibe: Max 3 words(Adjective + Noun).
        7. ActionItems: 3 simple tasks(Max 4 words each).
        8. ViralInsight: A sharp, relatable, slightly edgy or mystical one-liner about this energy. Something people would want to share on Instagram. (Max 15 words).
        9. LuckyStats: number (1-99), color name, colorHex (hex code matching the color e.g. "#E8A0B0"), crystal (a crystal/stone aligned with today's energy e.g. "Rose Quartz", "Citrine", "Amethyst").
        10. PlanetInfluences: 2-3 items explaining WHY they feel this way today. Each has: glyph (planet symbol like ☿ ♀ ♂ ☽ ♃ ♄), tag (e.g. "Venus trine your Moon"), effect (one sentence explaining the impact, max 15 words).
        11. DailyRitual: A short micro-ritual or practice aligned with today's energy. Max 20 words. (e.g. "Light a white candle and write 3 things you're grateful for" or "Carry citrine today for confidence").

        TONE:
    - Mystical but VERY SIMPLE to read.
        - STRICT "Grade 6-7 English" level. (No complex words).
        - Warm, encouraging, expert voice.

        Strictly follow schemas.Return JSON.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: periodSchema }
        });
        const data = cleanAndParseJson(response.text, fallback);
        await ForecastRepository.saveForecast(key, profile.id, period, forecastDate, data, expiration);
        return data;
    }, fallback);
};



export const generateDailyInsight = async (chart, date) => {
    // Generate daily horoscope insight from chart data
    const fallback = {
        header: "Cosmic Overview",
        powerCosmic: "Steady",
        luckyStats: { number: 7, color: "Gold" },
        mantra: "I trust the flow of the universe.",
        detailedHoroscope: "The stars align beautifully today. Trust your intuition and embrace the energy flowing through you.",
        actionItems: ["Breathe deeply", "Trust your instincts", "Connect with nature"],
        aspects: [],
    };

    const sunSign = chart?.planets?.find(p => p.name === 'Sun')?.sign || 'Aries';
    const moonSign = chart?.planets?.find(p => p.name === 'Moon')?.sign || '';
    const risingSign = chart?.planets?.find(p => p.name === 'Ascendant')?.sign || '';

    const prompt = `
        DAILY HOROSCOPE for today (${date.toISOString().split('T')[0]}).

        USER CHART:
        Sun: ${sunSign}
        Moon: ${moonSign}
        Ascendant: ${risingSign}
        Full Planets: ${chart?.planets?.map(p => `${p.name} in ${p.sign}`).join(', ') || 'N/A'}

        Generate a personalized daily reading.

        RULES:
        1. Header: Max 4 words (evocative title)
        2. PowerCosmic: Max 3 words (energy label)
        3. LuckyStats: number (1-99) and color name
        4. Mantra: Simple affirmation (max 10 words)
        5. DetailedHoroscope: 3-4 paragraphs, ~150 words total. Personal, specific to their signs.
        6. ActionItems: 3 practical actions (max 5 words each)
        7. Aspects: Up to 2 key transit labels (e.g. "Venus trine Moon")

        TONE: Warm, mystical, Grade 6-7 English.
        JSON Only.
    `;

    const dailyInsightSchema = {
        type: Type.OBJECT,
        properties: {
            header: { type: Type.STRING },
            powerCosmic: { type: Type.STRING },
            luckyStats: {
                type: Type.OBJECT,
                properties: { number: { type: Type.INTEGER }, color: { type: Type.STRING } },
                required: ["number", "color"]
            },
            mantra: { type: Type.STRING },
            detailedHoroscope: { type: Type.STRING },
            actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
            aspects: { type: Type.ARRAY, items: {
                type: Type.OBJECT,
                properties: { label: { type: Type.STRING } },
                required: ["label"]
            }},
        },
        required: ["header", "powerCosmic", "luckyStats", "mantra", "detailedHoroscope", "actionItems"]
    };

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: dailyInsightSchema }
        });
        return cleanAndParseJson(response.text, fallback);
    }, fallback);
};

export const generateDailyLetter = async (zodiacSign = "Aries") => {
    // Legacy - No persistence needed, just return API result
    const prompt = `Daily letter for ${zodiacSign}.
        Tone: Grade 6 - 7 English.Warm, personal, and encouraging.
    JSON Only.`;
    const fallback = { headline: "Stars Align", content: "Good vibes." };

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: dailyLetterSchema }
        });
        return cleanAndParseJson(response.text, fallback);
    }, fallback);
};

export const generateChatResponse = async (history, userProfile) => {
    // No caching for chat needed
    const prompt = `Astrology Chat.History: ${JSON.stringify(history)}.User: ${userProfile.name}.`;
    const fallback = { response: "I'm listening...", followUpQuestions: [] };

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: chatSchema }
        });
        return cleanAndParseJson(response.text, fallback);
    }, fallback);
};

// --- CHAT SESSION HELPERS ---

export const createChatSession = async (userProfile, partnerProfile, sessionId) => {
    // Generate a persona-based system instruction
    // Serialize the full chart for the AI
    const chartData = userProfile.chart?.planets
        ? userProfile.chart.planets.map((p) => `${p.name}: ${p.sign} (House ${p.house})`).join(', ')
        : "Chart data unavailable";

    let partnerContext = "";
    let roleDef = `ROLE: You are a "Senior Astrologer & Compassionate Psychologist". You do not just give data; you give hope and clarity.`;

    // Determine current Title context (for new sessions)
    let threadTitle = "My Personal Guidance";

    if (partnerProfile) {
        const partnerChart = partnerProfile.chart?.planets
            ? partnerProfile.chart.planets.map((p) => `${p.name}: ${p.sign} (House ${p.house})`).join(', ')
            : "Partner Chart data unavailable";

        partnerContext = `
    PARTNER: ${partnerProfile.name}
    [PARTNER CHART]: ${partnerChart}
    RELATIONSHIP MODE: ACTIVATED
        `;
        roleDef = `ROLE: You are a "Relationship Astrologer & Guide". Help them navigate their connection with wisdom and empathy.`;
        threadTitle = `Relationship with ${partnerProfile.name}`;
    }

    // Generate Transits Context (Current Weather)
    const now = new Date();
    // We can use a simplified transit list or call a helper if available. 
    // For now, we will inject the Date to ensure at least time-awareness.
    const currentDateString = now.toDateString();

    const systemInstruction = `
    ${roleDef}
    
    === DATA CONTEXT ===
    CURRENT DATE: ${currentDateString}
    PRIMARY USER: ${userProfile.name}
    [USER CHART]: ${chartData}
    
    ${partnerContext}
    ====================

    CRITICAL RULES:
    1. MEMORY PERMANENCE: You possess the birth charts for BOTH the User and the Partner (if listed above). NEVER claim you need their details. The data is right here.
    2. THE "CHART-FIRST" RULE: specific placements > generic advice.
    3. THE "PSYCHOLOGIST" TONE: Validate feelings, then offer astral solutions.
    4. LANGUAGE: STRICT Grade 6-7 English. Simple, warm, direct.
    5. FORMATTING: 
       - Use **Bold** for Planet Names and Signs (e.g. **Mars**, **Aries**).
       - Keep paragraphs SHORT (Max 3 sentences).
       - Use Bullet Points for lists.
    6. LENGTH: Keep responses CONCISE. Max 150 words per turn unless asked for a deep dive.
    7. ENGAGEMENT: Always end with ONE short, deep follow-up question to keep the user exploring.
    `;

    // console.log("[Gemini] Generated System Instruction:", systemInstruction);

    // PERSISTENCE LOGIC
    let history = [];
    let activeSessionId = sessionId;

    try {
        if (activeSessionId) {
            // Load existing history from DB
            console.log("[Gemini] Loading history for session:", activeSessionId);
            const messages = await ChatRepository.getMessages(activeSessionId);
            history = messages.map(m => ({
                role: m.role,
                parts: [{ text: m.text }]
            }));
            console.log(`[Gemini] Loaded ${messages.length} past messages.`);
        } else {
            // Create TRANSIENT Session (In-Memory Only)
            // We do NOT save to DB yet. We wait for the first message.
            console.log("[Gemini] Creating Transient Session...");
            activeSessionId = undefined; // No ID yet
            history = [];
        }
    } catch (e) {
        console.error("[Gemini] Failed to initialize DB session:", e);
    }

    return {
        id: activeSessionId,
        history: history,
        systemInstruction: systemInstruction,
        model: MODELS[0],
        // Metadata for later creation
        meta: {
            title: threadTitle,
            partnerId: partnerProfile?.id
        }
    };
};

export const sendChatMessage = async (session, message) => {
    try {
        // 1. PERSISTENCE: Ensure Session & User Message are saved BEFORE AI call
        // This ensures "Quick to fetch from history" even if user leaves immediately.
        try {
            if (!session.id) {
                console.log("[Gemini] Persisting Transient Session...");
                const title = message.length > 40 ? message.substring(0, 40) + "..." : message;
                const newDbSession = await ChatRepository.createSession(title, session.meta?.partnerId);
                session.id = newDbSession.id; // Update session Ref
            } else {
                // Auto-Rename logic for existing sessions if needed (e.g. first real message after cleanup)
                if (session.history.length === 0) {
                    const newTitle = message.length > 40 ? message.substring(0, 40) + "..." : message;
                    await ChatRepository.updateSessionTitle(session.id, newTitle);
                }
            }

            // Save USER message immediately
            await ChatRepository.addMessage(session.id, 'user', message);

        } catch (dbErr) {
            console.error("Failed to save initial chat state:", dbErr);
            // If we failed to create a session, we cannot proceed with saving messages.
            // However, we might want to still show the AI response transiently?
            // But next time it won't be there.
            // Let's at least ensure we don't try to save the model message to an invalid session.
            if (!session.id) {
                console.warn("[Gemini] Session creation failed. AI response will be transient only.");
            }
        }

        // Optimistic update of history for the call
        const newHistory = [
            ...session.history,
            { role: 'user', parts: [{ text: message }] }
        ];

        const response = await ai.models.generateContent({
            model: session.model,
            contents: newHistory,
            config: {
                systemInstruction: session.systemInstruction,
            }
        });

        // Safe text extraction
        let text = "";
        try {
            if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
                text = response.candidates[0].content.parts[0].text;
            } else if (typeof (response).text === 'function') {
                text = (response).text();
            }
        } catch (err) {
            console.warn("Failed to extract text from response:", err);
        }

        if (!text) throw new Error("No response generated");

        // Update session history
        session.history.push({ role: 'user', parts: [{ text: message }] });
        session.history.push({ role: 'model', parts: [{ text: text }] });

        // 2. PERSISTENCE: Save Model Message
        try {
            if (session.id) {
                await ChatRepository.addMessage(session.id, 'model', text);
            }
        } catch (err) {
            console.error("Failed to save model message:", err);
        }

        return text;
    } catch (e) {
        console.error("Chat Error:", e);
        if (e.message?.includes('429') || e.message?.includes('503')) {
            return "The cosmic channels are busy. Please try again in a moment.";
        }
        if (e.message?.includes('Network request failed') || e.message?.toLowerCase().includes('network')) {
            return "The connection to the stars is interrupted. Please check your internet and try again.";
        }
        return "The stars are silent. (System Error)";
    }
};

// --- THEME ANALYSIS HELPER ---

// Schema for Theme Analysis (Love/Career Deep Dives)
const themeAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING },
        vibe: { type: Type.STRING },
        analysis: { type: Type.STRING },
        action: { type: Type.STRING },
        timing: { type: Type.STRING }
    },
    required: ["headline", "vibe", "analysis", "action", "timing"]
};

export const generateThemeAnalysis = async (profile, theme, context = 'today') => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${profile.id}_theme_${theme}_${context}_${today} `;

    // Set expiration based on context
    let expiration = Date.now() + 24 * 60 * 60 * 1000;
    if (context === 'weekly') expiration = Date.now() + 7 * 24 * 60 * 60 * 1000;
    if (context === 'monthly') expiration = Date.now() + 30 * 24 * 60 * 60 * 1000;
    if (context === 'yearly') expiration = Date.now() + 365 * 24 * 60 * 60 * 1000;

    const cached = await ForecastRepository.getForecast(key);
    if (cached) return cached;

    const fallback = {
        headline: `${theme} Focus`,
        vibe: "Steady",
        analysis: "Focus on stability. The stars suggest a time of grounding.",
        action: "Take small steps towards your goal.",
        timing: "The energy is building."
    };

    const astralSig = getAstralSignature(profile);

    // Theme specific instructions
    let focusInstructions = "";
    let structureInstructions = "";

    // Special Handling for "Today & Tomorrow Love" - Ultra Deep
    const isDaily = context === 'today' || context === 'tomorrow';

    if (theme === 'Love' && isDaily) {
        focusInstructions = "Focus HEAVILY on the Moon (Mood), Venus (Attraction), and Mars (Passion) transits for this period. Real-time relationship weather.";
        structureInstructions = `3. Analysis: EXACTLY 3 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Heart's Weather): Internal emotional landscape. How do they feel? (Max 45 words).
                - Para 2(Connection Potential): External romantic dynamics.Is it a day for dates or solitude ? (Max 45 words).
    - Para 3(Sacred Advice): High - level spiritual guidance for intimacy. (Max 45 words).
           TOTAL length ~135 words.`;
    } else if (theme === 'Career' && isDaily) {
        // Special Handling for "Today & Tomorrow Career" - Ultra Deep
        focusInstructions = "Focus HEAVILY on Saturn (Discipline), Mars (Action), and Mercury (Data/Comms). Real-time professional strategy.";
        structureInstructions = `3. Analysis: EXACTLY 3 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Power Move): Where should they direct their energy ? (Max 45 words).
    - Para 2(The Obstacle): Potential friction with authority or details. (Max 45 words).
           - Para 3(The Strategy): High - level advice for long - term success. (Max 45 words).
           TOTAL length ~135 words.`;
    } else if (theme === 'Career' && isDaily) {
        // Special Handling for "Today & Tomorrow Career" - Ultra Deep
        focusInstructions = "Focus HEAVILY on Saturn (Discipline), Mars (Action), and Mercury (Data/Comms). Real-time professional strategy.";
        structureInstructions = `3. Analysis: EXACTLY 3 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Power Move): Where should they direct their energy ? (Max 45 words).
    - Para 2(The Obstacle): Potential friction with authority or details. (Max 45 words).
           - Para 3(The Strategy): High - level advice for long - term success. (Max 45 words).
           TOTAL length ~135 words.`;
    } else if (theme === 'Love' && context === 'weekly') {
        // Weekly Love - Timeline
        focusInstructions = "Focus on Venus and Mars trends throughout the week. Weekdays vs Weekend.";
        structureInstructions = `3. Analysis: EXACTLY 2 distinct paragraphs separated by "\\n\\n".
           - Para 1(Weekdays Mon - Fri): The working vibe.Routine vs Connection. (Max 50 words).
           - Para 2(The Weekend): Peak romantic potentials and social energy. (Max 50 words).`;
    } else if (theme === 'Career' && context === 'weekly') {
        // Weekly Career - Timeline
        focusInstructions = "Focus on Saturn (Structure) and Mercury (Productivity) for the work week.";
        structureInstructions = `3. Analysis: EXACTLY 2 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Grind Mon - Fri): Productivity and focus areas. (Max 50 words).
           - Para 2(The Strategic Review): What to plan for next week. (Max 50 words).`;
    } else if (theme === 'Love' && context === 'monthly') {
        // Monthly Love - Roadmap
        focusInstructions = "Focus on Venus ingress dates and Moon phases for the whole month.";
        structureInstructions = `3. Analysis: EXACTLY 2 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Romantic Texture): The overall feeling of love this month. (Max 50 words).
           - Para 2(Relationship Work): Where to put effort ? (Max 50 words).
    4. Action: A monthly relationship goal. (Max 15 words).
        5. Timing: List the TOP 3 dates for love. (Max 20 words).`;
    } else if (theme === 'Career' && context === 'monthly') {
        // Monthly Career - Roadmap
        focusInstructions = "Focus on Jupiter (Growth) and Mars (Drive) peaks this month.";
        structureInstructions = `3. Analysis: EXACTLY 2 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Big Goal): What can be achieved this month ? (Max 50 words).
    - Para 2(The Hustle): When to push hardest ? (Max 50 words).
    4. Action: A major professional milestone to hit. (Max 15 words).
        5. Timing: List the TOP 3 'Power Days' for career moves. (Max 20 words).`;
    } else if (theme === 'Love' && context === 'yearly') {
        // Yearly Love - The Saga
        focusInstructions = "Focus on Venus Retrogrades and Jupiter transits for the entire year.";
        structureInstructions = `3. Analysis: EXACTLY 3 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Love Theme): The main romantic lesson for the year. (Max 60 words).
           - Para 2(The Work): What challenges or patterns to break?(Max 60 words).
    - Para 3(The Harvest): The growth or commitment potential by year - end. (Max 60 words).
        4. Action: Your 'Love Resolution' for the year. (Max 15 words).
        5. Timing: Identify the "Power Season"(e.g. "Summer is your peak"). (Max 20 words).`;
    } else if (theme === 'Career' && context === 'yearly') {
        // Yearly Career - The Empire
        focusInstructions = "Focus on Saturn (Structure) and Jupiter (Luck) balance for the year.";
        structureInstructions = `3. Analysis: EXACTLY 3 distinct paragraphs separated by "\\n\\n".
           - Para 1(The Mountain): The major goal or ambition for the year. (Max 60 words).
           - Para 2(The Climb): Hard work or restructuring required mid - year. (Max 60 words).
           - Para 3(The Summit): Where you will stand by December. (Max 60 words).
        4. Action: Your 'Career Resolution' for the year. (Max 15 words).
        5. Timing: Identify the "Power Quarter"(e.g. "Q4 is your launch time"). (Max 20 words).`;
    } else if (theme === 'Love') {
        // Fallback
        focusInstructions = "Focus on Venus and Mars trends.";
        structureInstructions = `3. Analysis: EXACTLY 2 distinct paragraphs separated by "\\n\\n". (The Trend + The Advice).Max 80 words total.`;
    } else {
        // Fallback
        focusInstructions = "Focus on Saturn (Structure), Jupiter (Growth), Mercury (Communication), and the 10th House.";
        structureInstructions = `3. Analysis: EXACTLY 2 distinct paragraphs separated by "\\n\\n". (Current Outlook + Strategic Move).Max 80 words total.`;
    }

    const prompt = `
        THEME ANALYSIS: ${theme.toUpperCase()}.
    Context: ${context.toUpperCase()} Forecast.

        USER PROFILE:
        ${astralSig}

    INSTRUCTIONS:
        ${focusInstructions}
        Provide a deep, strategic insight for this specific user.

        STRICT FORMATTING:
    1. Headline: High - impact title(Max 5 words, e.g. "Venusian Glow").
        2. Vibe: 2 - 3 words(Adjective + Noun).
        ${structureInstructions}
    4. Action: A specific, concrete step to take(Max 15 words).
        5. Timing: When is the peak moment ? (Max 10 words).

    TONE:
    - Professional, Insightful, Empowering.
        - Grade 6 - 7 English.
        - No generic horoscope fluff.Be specific.

        JSON Only.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: themeAnalysisSchema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        const data = { ...fallback, ...parsed };
        await ForecastRepository.saveForecast(key, profile.id, `theme_${theme}_${context} `, today, data, expiration);
        return data;
    }, fallback);
};

export const generateYesterdayInsight = async (profile, currentForecast) => {
    // Return a reflective version of the daily forecast
    return {
        ...currentForecast,
        header: "Yesterday's Reflection",
        mantra: "I learn from the past to empower my present.",
        detailedHoroscope: "Reflect on the energies of yesterday. " + (currentForecast?.detailedHoroscope || ""),
        actionItems: ["Journal about yesterday", "Rest"]
    };
};

export const generateDomainInsight = async (profile, domain) => generateThemeAnalysis(profile, domain, 'today');

// --- MATCH / SYNASTRY GENERATION ---

const matchCoreSchema = {
    type: Type.OBJECT,
    properties: {
        headline: { type: Type.STRING },
        relationshipArchetype: { type: Type.STRING },
        snapshot: { type: Type.STRING },
        viralVerdict: { type: Type.STRING },
        viralHook: { type: Type.STRING }
    },
    required: ["headline", "relationshipArchetype", "snapshot", "viralVerdict", "viralHook"]
};

// Helper to extract key astrological identity for prompts
const getAstralSignature = (profile) => {
    if (!profile?.chart?.planets) return "Unknown Chart";
    const getSign = (name) => profile.chart.planets.find((p) => p.name === name)?.sign || '?';
    // Sun/Moon/Asc/Venus/Mars are the "Big 5" for compatibility
    return `
    Name: ${profile.name}
    Sun: ${getSign('Sun')}
    Moon: ${getSign('Moon')}
    Ascendant: ${getSign('Ascendant')}
    Venus: ${getSign('Venus')}
    Mars: ${getSign('Mars')}
    `.trim();
};

export const generateMatchCore = async (p1, p2, synastry) => {
    const key = `${p1.id}_${p2.id} _match_core`;
    const cached = await ReportRepository.getReport(key);
    if (cached) return cached;

    const p1Sig = getAstralSignature(p1);
    const p2Sig = getAstralSignature(p2);

    const prompt = `
        RELATIONSHIP ANALYST: Compatibility Report.
        
        Partner A:
        ${p1Sig}

        Partner B:
        ${p2Sig}

        Math Score: ${synastry.harmonyScore}/100.

    TASK:
    1. Headline: A short, catchy title(Max 5 words).
        2. Archetype: A mystical 2 - word title(e.g. "Cosmic Mirrors").
        3. Snapshot: Exactly 2 simple sentences summarizing their vibe(Max 25 words total).
        4. ViralVerdict: Max 2 words. A strong, emotional label. (e.g. "SOULMATES", "CHAOTIC", "HOT & COLD").
        5. ViralHook: Max 15 words. A specific, identity-based roast or toast. START with "Your [Sign]...". (e.g. "Your Aries Sun overpowers their Libra Moon.").

        TONE:
    - Mystical but very simple. 
        - Grade 6 - 7 reading level(Easy English).
        - No complex jargon.

        Output JSON Only.
    `;
    const fallback = {
        headline: "A Cosmic Connection",
        relationshipArchetype: "Star-Crossed Souls",
        snapshot: "Energy flows between you two. You balance each other well.",
        viralVerdict: "COSMIC BOND",
        viralHook: "Your energies align perfectly, creating a rare harmony."
    };

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: matchCoreSchema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        const data = { ...fallback, ...parsed };
        await ReportRepository.saveReport(key, p1.id, 'match', data, 'core');
        return data;
    }, fallback);
};

export const generateMatchDetails = async (p1, p2) => {
    const key = `${p1.id}_${p2.id} _match_details`;
    const cached = await ReportRepository.getReport(key);
    if (cached) return cached;

    const p1Sig = getAstralSignature(p1);
    const p2Sig = getAstralSignature(p2);

    // Returns 'areas', 'sharedValues', 'growthTensions', 'support'
    const prompt = `
        DEEP DIVE COMPATIBILITY ANALYSIS.
        
        Partner A:
        ${p1Sig}

        Partner B:
        ${p2Sig}

    TASK:
        Analyze the specific dynamics in these areas based on their Moon(Emotion), Mercury(Comm), and Venus(Values).
        
        STRICT WRITING RULES:
    1. NAMES: Use REAL NAMES(e.g. "${p1.name}" and "${p2.name}") explicitly.NEVER use "Partner A/B" or "The User".
        2. TONE: Expert Astrologer but simple(Grade 6 - 7).Warm, wise, and specific.
        
        Generate JSON with:
    - areas: { emotional, physical, communication, stability, growth } 
          * strength(Max 40 words.Describe the positive flow vividly.)
        * tension(Max 40 words.Describe the friction point clearly.)
        * analysis: EXACTLY 2 paragraphs separated by "\\n\\n". 
             - Para 1(The Why): Explain the ASTROLOGY mechanics(e.g. "Because ${p1.name}'s Moon is Water and ${p2.name}'s is Fire..."). (Max 60 words).
             - Para 2(The How / Advice): Practical advice for harmony. (Max 50 words).
          * reflection(Max 15 words, deep question)
        * score(0 - 100)
        - sharedValues(3 items, Max 2 words each)
            - growthTensions: { title, insight } [](2 items, Insight max 15 words)
                - support: { emotional, practical } (Max 10 words each)

        JSON Only.
    `;

    const fallback = {
        areas: {
            emotional: { score: 80, strength: "You confirm each other's feelings deeply.", tension: "Sometimes you drown in each other's moods.", analysis: "Because...", reflection: "How to ground?" },
            physical: { score: 75, strength: "A magnetic pull that feels fated.", tension: "Different energy levels can clash.", analysis: "Energies align...", reflection: "Sync up." },
            communication: { score: 85, strength: "You understand without speaking.", tension: "Assumptions cause silence.", analysis: "Mercury helps...", reflection: "Ask more." },
            stability: { score: 70, strength: "Building a shared safe space.", tension: "Spending habits might differ.", analysis: "Saturn guides...", reflection: "Plan together." },
            growth: { score: 90, strength: "You push each other to evolve.", tension: "Change can feel too fast.", analysis: "Jupiter expands...", reflection: "Support change." }
        },
        sharedValues: ["Authenticity", "Adventure", "Loyalty"],
        growthTensions: [
            { title: "Freedom vs Closeness", insight: "Balance is key." },
            { title: "Speed of Life", insight: "Patience required." }
        ],
        support: { emotional: "Always there.", practical: "Problem solver." }
    };

    return withRetry(async () => {
        const detailSchema = {
            type: Type.OBJECT,
            properties: {
                areas: {
                    type: Type.OBJECT,
                    properties: {
                        emotional: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, strength: { type: Type.STRING }, tension: { type: Type.STRING }, analysis: { type: Type.STRING }, reflection: { type: Type.STRING } }, required: ["score", "strength", "tension", "analysis", "reflection"] },
                        physical: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, strength: { type: Type.STRING }, tension: { type: Type.STRING }, analysis: { type: Type.STRING }, reflection: { type: Type.STRING } }, required: ["score", "strength", "tension", "analysis", "reflection"] },
                        communication: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, strength: { type: Type.STRING }, tension: { type: Type.STRING }, analysis: { type: Type.STRING }, reflection: { type: Type.STRING } }, required: ["score", "strength", "tension", "analysis", "reflection"] },
                        stability: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, strength: { type: Type.STRING }, tension: { type: Type.STRING }, analysis: { type: Type.STRING }, reflection: { type: Type.STRING } }, required: ["score", "strength", "tension", "analysis", "reflection"] },
                        growth: { type: Type.OBJECT, properties: { score: { type: Type.INTEGER }, strength: { type: Type.STRING }, tension: { type: Type.STRING }, analysis: { type: Type.STRING }, reflection: { type: Type.STRING } }, required: ["score", "strength", "tension", "analysis", "reflection"] }
                    },
                    required: ["emotional", "physical", "communication", "stability", "growth"]
                },
                sharedValues: { type: Type.ARRAY, items: { type: Type.STRING } },
                growthTensions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, insight: { type: Type.STRING } }, required: ["title", "insight"] } },
                support: { type: Type.OBJECT, properties: { emotional: { type: Type.STRING }, practical: { type: Type.STRING } }, required: ["emotional", "practical"] }
            },
            required: ["areas", "sharedValues", "growthTensions", "support"]
        };

        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: detailSchema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        const data = { ...fallback, ...parsed };
        await ReportRepository.saveReport(key, p1.id, 'match', data, 'details');
        return data;
    }, fallback);
};

export const generateMatchInsights = async (p1, p2) => {
    const key = `${p1.id}_${p2.id} _match_insights`;
    const cached = await ReportRepository.getReport(key);
    if (cached) return cached;

    const p1Sig = getAstralSignature(p1);
    const p2Sig = getAstralSignature(p2);

    const prompt = `
        RELATIONSHIP DESTINY & STORIES.
        
        Partner A:
        ${p1Sig}

        Partner B:
        ${p2Sig}

    TASK:
        Synthesize their relationship story.Find 3 mythological connections based on their planets.
        
        GENERATE SECTIONS(STRICT LENGTH LIMITS):
    1. goldenMatches: { title, insight } [](3 items.Insight: Max 10 words).
        2. cosmicDynamics: { label, userLabel, partnerLabel } [](3 items.Labels: Max 2 words).
        3. conflictManual: { trigger(Max 5 words), reactionUser(Max 10 words), reactionPartner(Max 10 words), resolution(Max 10 words) }.
    4. planetaryStories: { planet, theme, story } [](3 items.Story: EXACTLY 2 sentences, Max 30 words).
        5. integration: One final summary paragraph(Max 40 words).
        6. karmicVerdict: 2 words(e.g. "Soul Contract").

        TONE:
    - Mystical but VERY SIMPLE.
        - Grade 6 - 7 reading level.
        - Consistent formatting is critical.
        
        JSON Only.
    `;

    const fallback = {
        goldenMatches: [{ title: "Mental Link", insight: "Telecom connection." }],
        cosmicDynamics: [{ label: "Communication", userLabel: "The Talker", partnerLabel: "The Listener" }],
        conflictManual: { trigger: "Stress", reactionUser: "Withdraw", reactionPartner: "Push", resolution: "Space" },
        planetaryStories: [{ planet: "Venus", theme: "Love", story: "A beautiful dance." }],
        integration: "A journey of mutual discovery. You teach each other important lessons.",
        karmicVerdict: "Fated Bond"
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            goldenMatches: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, insight: { type: Type.STRING } }, required: ["title", "insight"] } },
            cosmicDynamics: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { label: { type: Type.STRING }, userLabel: { type: Type.STRING }, partnerLabel: { type: Type.STRING } }, required: ["label", "userLabel", "partnerLabel"] } },
            conflictManual: { type: Type.OBJECT, properties: { trigger: { type: Type.STRING }, reactionUser: { type: Type.STRING }, reactionPartner: { type: Type.STRING }, resolution: { type: Type.STRING } }, required: ["trigger", "reactionUser", "reactionPartner", "resolution"] },
            planetaryStories: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { planet: { type: Type.STRING }, theme: { type: Type.STRING }, story: { type: Type.STRING } }, required: ["planet", "theme", "story"] } },
            integration: { type: Type.STRING },
            karmicVerdict: { type: Type.STRING }
        },
        required: ["goldenMatches", "cosmicDynamics", "conflictManual", "planetaryStories", "integration", "karmicVerdict"]
    };

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        const data = { ...fallback, ...parsed };
        await ReportRepository.saveReport(key, p1.id, 'match', data, 'insights');
        return data;
    }, fallback);
};

// --- VIRAL MATCH INSIGHTS (for shareable story cards) ---

const viralInsightSchema = {
    type: Type.OBJECT,
    properties: {
        spark: { type: Type.STRING },
        tension: { type: Type.STRING },
        truth: { type: Type.STRING },
        oneWord: { type: Type.STRING },
    },
    required: ["spark", "tension", "truth", "oneWord"]
};

export const generateMatchViralInsights = async (p1, p2, synastry) => {
    const p1Sig = getAstralSignature(p1);
    const p2Sig = getAstralSignature(p2);

    const prompt = `
You write viral Instagram-worthy astrology content for a premium app (like Co-Star).

Generate 3 provocative, shareable insights about this match.

PARTNER A:
${p1Sig}

PARTNER B:
${p2Sig}

COMPATIBILITY: ${synastry?.harmonyScore || 50}%
Emotional: ${synastry?.scores?.emotional || 50}%
Communication: ${synastry?.scores?.communication || 50}%
Attraction: ${synastry?.scores?.attraction || 50}%
Stability: ${synastry?.scores?.stability || 50}%

GENERATE:
1. "spark" — What magnetically draws them together. Reference their specific placements.
2. "tension" — What they'll fight about. Slightly roast-y, funny, but real.
3. "truth" — What neither will admit about the other. Vulnerable, piercing.
4. "oneWord" — Single word that captures this match energy (e.g. Magnetic, Electric, Chaotic, Fated, Combustible).

RULES:
- Each insight: 1-2 sentences, MAX 18 words
- Reference specific sign traits — not generic
- Write like Co-Star: direct, lowercase energy, slightly provocative
- NO emoji, NO exclamation marks, NO generic horoscope language
- NO "the stars" or "the universe" or "cosmic connection"
- Must sound like something someone would screenshot and send to the other person
- Use "you" and "they/them" — never names

JSON only.
    `.trim();

    const fallback = {
        spark: "An attraction that doesn't need explaining. You both just know.",
        tension: "You want the same thing but refuse to say it first.",
        truth: "They see through your walls. That's exactly why it scares you.",
        oneWord: "Magnetic",
    };

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: viralInsightSchema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        return { ...fallback, ...parsed };
    }, fallback);
};

export const generateDeepMatchReport = async (p1, p2, synastry) => {
    const p1Sig = getAstralSignature(p1);
    const p2Sig = getAstralSignature(p2);
    const p1Name = p1.name?.split(' ')[0] || 'Partner A';
    const p2Name = p2.name?.split(' ')[0] || 'Partner B';
    const score = synastry?.harmonyScore || 75;

    const prompt = `
        PREMIUM IN-DEPTH COMPATIBILITY REPORT — for a premium astrology app PDF.

        ${p1Name}'s Chart:
        ${p1Sig}

        ${p2Name}'s Chart:
        ${p2Sig}

        Overall Compatibility Score: ${score}/100
        Emotional: ${synastry?.scores?.emotional || 70}/100
        Communication: ${synastry?.scores?.communication || 70}/100
        Attraction: ${synastry?.scores?.attraction || 70}/100
        Stability: ${synastry?.scores?.stability || 70}/100

    TASK: Generate a deeply personal, astrology-rich compatibility report. Use ${p1Name} and ${p2Name} by name throughout. This is for a young woman who loves astrology — make it feel like her best friend who's also an expert astrologer wrote it.

    GENERATE THESE SECTIONS:

    1. headline: Catchy 3-5 word title for the match (e.g. "Fire Meets Water")
    2. tagline: One poetic sentence about this pairing (max 15 words)
    3. overview: 2 rich paragraphs about their overall dynamic. Reference specific placements. Separate with \\n\\n. (max 200 words total)
    4. soulConnection: { title (3 words), description (2 paragraphs, max 150 words). What draws them together on a soul level. Reference North Node, Moon, or 7th house. }
    5. emotionalDynamic: { title, howYouLove (paragraph about ${p1Name}'s emotional style based on Moon/Venus, max 80 words), howTheyLove (paragraph about ${p2Name}'s emotional style, max 80 words), together (paragraph about their emotional chemistry together, max 80 words) }
    6. communicationStyle: { title, dynamic (2 paragraphs about Mercury interplay, max 150 words), tip (one practical sentence) }
    7. attraction: { title, spark (what creates the magnetic pull - reference Mars/Venus, max 100 words), tension (what creates friction, max 80 words) }
    8. growthAreas: [{ title (2-3 words), insight (2 sentences, max 40 words) }] — exactly 3 items
    9. loveLanguages: { user (${p1Name}'s love language based on Venus sign, max 30 words), partner (${p2Name}'s love language, max 30 words) }
    10. conflictStyle: { triggers (what causes fights based on Mars placements, max 60 words), resolution (how to resolve based on their charts, max 60 words) }
    11. longTerm: { forecast (2 paragraphs about long-term potential, reference Saturn aspects, max 150 words), verdict (one bold sentence) }
    12. advice: [string] — exactly 5 specific, actionable relationship tips (max 15 words each)
    13. cosmicVerdict: 2-3 powerful words (e.g. "Destined Soulmates", "Beautiful Chaos")
    14. closingMessage: A warm, personal closing paragraph addressed to ${p1Name} about this relationship (max 80 words)

    TONE:
    - Like a wise best friend who reads charts. Warm, specific, never generic.
    - Reference REAL placements (e.g. "Your Scorpio Moon craves depth, while his Gemini Moon needs space")
    - Grade 7-8 reading level. Mystical but accessible.
    - Never say "Partner A/B". Always use names.

    JSON Only.
    `;

    const fallback = {
        headline: "A Cosmic Connection",
        tagline: "Two souls drawn together by the stars.",
        overview: "Your charts reveal a meaningful connection.\n\nThere is real potential here for growth and love.",
        soulConnection: { title: "Karmic Bond", description: "A deep pull exists between you two.\n\nThis connection feels fated." },
        emotionalDynamic: { title: "Heart Languages", howYouLove: "You love deeply and intensely.", howTheyLove: "They show love through actions.", together: "Together you create emotional safety." },
        communicationStyle: { title: "Mind Meld", dynamic: "Your communication has a natural flow.\n\nYou understand each other's wavelength.", tip: "Listen before reacting." },
        attraction: { title: "Magnetic Pull", spark: "There is undeniable chemistry between you.", tension: "Different paces can create friction." },
        growthAreas: [
            { title: "Trust Building", insight: "Opening up takes time. Be patient with each other." },
            { title: "Space & Closeness", insight: "Finding the right balance is key for long-term harmony." },
            { title: "Shared Dreams", insight: "Aligning your visions will strengthen this bond." }
        ],
        loveLanguages: { user: "Words of affirmation and quality time.", partner: "Acts of service and physical touch." },
        conflictStyle: { triggers: "Miscommunication and unspoken expectations.", resolution: "Honest conversations and giving each other space to process." },
        longTerm: { forecast: "This relationship has genuine long-term potential.\n\nWith effort from both sides, this can deepen beautifully.", verdict: "Worth fighting for." },
        advice: ["Communicate your needs clearly", "Give space when emotions run high", "Celebrate small moments together", "Be honest about your fears", "Never stop being curious about each other"],
        cosmicVerdict: "Cosmic Potential",
        closingMessage: "This connection has something special. Trust the journey and trust each other."
    };

    const schema = {
        type: Type.OBJECT,
        properties: {
            headline: { type: Type.STRING },
            tagline: { type: Type.STRING },
            overview: { type: Type.STRING },
            soulConnection: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, description: { type: Type.STRING } }, required: ["title", "description"] },
            emotionalDynamic: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, howYouLove: { type: Type.STRING }, howTheyLove: { type: Type.STRING }, together: { type: Type.STRING } }, required: ["title", "howYouLove", "howTheyLove", "together"] },
            communicationStyle: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, dynamic: { type: Type.STRING }, tip: { type: Type.STRING } }, required: ["title", "dynamic", "tip"] },
            attraction: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, spark: { type: Type.STRING }, tension: { type: Type.STRING } }, required: ["title", "spark", "tension"] },
            growthAreas: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { title: { type: Type.STRING }, insight: { type: Type.STRING } }, required: ["title", "insight"] } },
            loveLanguages: { type: Type.OBJECT, properties: { user: { type: Type.STRING }, partner: { type: Type.STRING } }, required: ["user", "partner"] },
            conflictStyle: { type: Type.OBJECT, properties: { triggers: { type: Type.STRING }, resolution: { type: Type.STRING } }, required: ["triggers", "resolution"] },
            longTerm: { type: Type.OBJECT, properties: { forecast: { type: Type.STRING }, verdict: { type: Type.STRING } }, required: ["forecast", "verdict"] },
            advice: { type: Type.ARRAY, items: { type: Type.STRING } },
            cosmicVerdict: { type: Type.STRING },
            closingMessage: { type: Type.STRING }
        },
        required: ["headline", "tagline", "overview", "soulConnection", "emotionalDynamic", "communicationStyle", "attraction", "growthAreas", "loveLanguages", "conflictStyle", "longTerm", "advice", "cosmicVerdict", "closingMessage"]
    };

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: schema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        return { ...fallback, ...parsed };
    }, fallback);
};

export const generateRelationshipForecast = async (p1, p2) => {
    const today = new Date().toISOString().split('T')[0];
    const key = `${p1.id}_${p2.id}_match_daily_${today} `;
    const expiration = Date.now() + 24 * 60 * 60 * 1000;

    const cached = await ForecastRepository.getForecast(key);
    if (cached) return cached;

    const fallback = {
        headline: "Cosmic Connection",
        vibe: "Harmony is your keyword today.",
        do: "Share a moment.",
        dont: "Bring up old past.",
        cosmicFocus: "Emotional Sync"
    };

    const prompt = `
        Daily Relationship Forecast for ${p1.name}(Sun: ${p1.chart?.planets[0]?.sign}) & ${p2.name}(Sun: ${p2.chart?.planets[0]?.sign}).
        Date: ${today}.
    Date: ${today}.
    Context: One sentence for each field.
        Tone: Mystical but SIMPLE.Grade 6 - 7 English.
        JSON Only: headline, vibe, do, dont, cosmicFocus.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: relationshipForecastSchema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        const data = { ...fallback, ...parsed };
        await ForecastRepository.saveForecast(key, p1.id, 'match_daily', today, data, expiration);
        return data;
    }, fallback);
};

// --- FULL REPORT GENERATION ---

const REPORT_PROMPTS = {
    love: {
        focus: 'Venus placement, 7th house, 5th house, Mars, Moon',
        instruction: `Write a comprehensive Love Report. Cover:
        1. Love Language (based on Venus sign & house)
        2. Attraction Patterns (Mars + Venus aspects)
        3. Emotional Needs in Romance (Moon sign & 7th house)
        4. Ideal Partner Profile (7th house cusp + ruler)
        5. Relationship Challenges (Saturn/Pluto aspects to Venus)
        6. Timing of Love (Venus progressions & transits)`
    },
    career: {
        focus: '10th house, Saturn, Midheaven, 6th house, Jupiter',
        instruction: `Write a comprehensive Career Report. Cover:
        1. Professional Identity (Midheaven sign + ruler)
        2. Work Style (6th house + Mercury)
        3. Leadership & Ambition (10th house planets + Saturn)
        4. Financial Potential (2nd house + Jupiter aspects)
        5. Career Challenges (Saturn squares/oppositions)
        6. Best Career Paths (Midheaven + stellium analysis)`
    },
    lunar: {
        focus: 'Moon sign, Moon house, Moon aspects, lunar nodes',
        instruction: `Write a Lunar Guide Report. Cover:
        1. Emotional Blueprint (Moon sign deep dive)
        2. Inner Security Needs (Moon house placement)
        3. Emotional Patterns (Moon aspects to other planets)
        4. Moon Phase at Birth (what it reveals about your rhythm)
        5. Healing Your Moon (remedies for Moon tensions)
        6. Lunar Rituals (personalized practices for each moon phase)`
    },
    purpose: {
        focus: 'North Node, South Node, Midheaven, Sun, Pluto',
        instruction: `Write a Life Purpose Report. Cover:
        1. Soul Mission (North Node sign & house)
        2. Past Life Patterns (South Node analysis)
        3. Core Identity & Power (Sun sign + house)
        4. Transformation Journey (Pluto placement)
        5. Life Lessons (Saturn placement + aspects)
        6. Destiny Activation Points (when purpose awakens)`
    },
    solar_return: {
        focus: 'Sun return chart, annual profection, major transits',
        instruction: `Write a Solar Return / Year Ahead Report. Cover:
        1. Year Theme (annual profection house)
        2. Q1 Energy (Jan-Mar outlook)
        3. Q2 Energy (Apr-Jun outlook)
        4. Q3 Energy (Jul-Sep outlook)
        5. Q4 Energy (Oct-Dec outlook)
        6. Key Dates & Power Windows for the year`
    },
    yearly: {
        focus: 'Annual profection house, profection lord, Jupiter transit, Saturn transit, eclipses, outer planet ingresses',
        instruction: `Write a Yearly Forecast Report using the profection year system. Cover:
        1. Profection Year (which house is activated, its sign, and ruling planet as "Lord of the Year")
        2. Major Outer Planet Transits (Saturn, Jupiter, Uranus, Neptune, Pluto aspects to natal chart)
        3. Q1 Forecast (themes, energy, key dates for Jan-Mar)
        4. Q2 Forecast (themes, energy, key dates for Apr-Jun)
        5. Q3 Forecast (themes, energy, key dates for Jul-Sep)
        6. Q4 Forecast (themes, energy, key dates for Oct-Dec)
        Include lucky windows, challenge periods, and life area forecasts (love, career, growth).`
    },
    transit: {
        focus: 'Current outer planet transits to natal chart, Saturn transit, Jupiter transit, eclipse axis, Mars/Venus transits',
        instruction: `Write a Transit Report analyzing the current planetary weather against the natal chart. Cover:
        1. Current Cosmic Climate (overview of outer planet positions and their natal aspects)
        2. Saturn Transit (which house/planet it's activating, what it demands)
        3. Jupiter Transit (where expansion and opportunity are flowing)
        4. Outer Planet Transits (Uranus, Neptune, Pluto — any major natal aspects)
        5. Inner Planet Highlights (Mars, Venus current transits of note)
        6. Key Dates (3-5 pivotal upcoming dates with themes)
        Focus on how transits affect love, career, and growth. Include "do this" advice and "watch for" warnings.`
    },
    monthly: {
        focus: 'Current month lunar phases, inner planet transits, Mercury/Venus/Mars sign changes, New Moon & Full Moon, eclipse if applicable',
        instruction: `Write a Monthly Forecast Report for the current calendar month. Cover:
        1. Month Overview (dominant planetary energy, zodiac season, overall tone)
        2. Week 1 Forecast (key transits, energy shifts, what to focus on)
        3. Week 2 Forecast (key transits, lunation events, momentum)
        4. Week 3 Forecast (mid-month pivot points, Full Moon impact)
        5. Week 4 Forecast (closing energy, what to release, what to prepare)
        6. Key Dates & Power Days (5-7 specific dates with what they mean for the native)
        Include New Moon and Full Moon themes for the month, Mercury/Venus/Mars sign changes, and personalized advice for love, career, and wellness each week.`
    }
};

export const generateFullReport = async (profile, reportType) => {
    const cacheKey = `${profile.id}_report_${reportType}`;
    const cached = await ReportRepository.getReport(cacheKey);
    if (cached) return cached;

    const reportConfig = REPORT_PROMPTS[reportType];
    if (!reportConfig) return null;

    const astralSig = getAstralSignature(profile);
    const chartData = profile.chart?.planets
        ? profile.chart.planets.map(p => `${p.name}: ${p.sign} ${p.degree.toFixed(0)}° (House ${p.house})${p.isRetrograde ? ' ℞' : ''}`).join('\n')
        : 'Chart data unavailable';

    const aspectData = profile.chart?.aspects
        ? profile.chart.aspects.slice(0, 15).map(a => `${a.planet1} ${a.type} ${a.planet2} (orb ${a.orb.toFixed(1)}°)`).join('\n')
        : '';

    const fallback = {
        title: `Your ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report`,
        summary: "Your chart reveals unique patterns worth exploring.",
        sections: [
            { heading: "Overview", body: "Your cosmic blueprint holds powerful insights for this area of life.", remedy: "Take time to reflect.", affirmation: "I am aligned with my purpose." },
            { heading: "Deep Dive", body: "The planetary positions in your chart create a distinctive energy signature.", remedy: "Journal your insights.", affirmation: "I trust the cosmic flow." },
            { heading: "Guidance", body: "The stars illuminate your path forward with clarity and wisdom.", remedy: "Meditate on your intentions.", affirmation: "I embrace my cosmic potential." },
        ],
        keyInsight: "Trust the journey your stars have mapped for you."
    };

    const prompt = `
        PREMIUM ASTROLOGY REPORT: ${reportType.toUpperCase()}

        USER:
        ${astralSig}

        FULL CHART:
        ${chartData}

        KEY ASPECTS:
        ${aspectData}

        FOCUS PLANETS: ${reportConfig.focus}

        ${reportConfig.instruction}

        WRITING RULES:
        1. Each section has: heading (max 4 words), body (2-3 rich paragraphs, ~100 words each), remedy (a practical action, max 20 words), affirmation (an "I am..." statement, max 12 words).
        2. Generate EXACTLY 6 sections.
        3. Title: Max 6 words, evocative.
        4. Summary: 2 sentences (max 40 words). Mystical hook.
        5. KeyInsight: One powerful closing sentence (max 20 words).

        TONE:
        - Deep but accessible (Grade 7-8 English).
        - Psychologically grounded, not generic horoscope.
        - Reference SPECIFIC placements (e.g., "Your Venus in Scorpio in the 8th house...").
        - Warm, validating, empowering.

        JSON Only.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: fullReportSchema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        const data = { ...fallback, ...parsed };
        await ReportRepository.saveReport(cacheKey, profile.id, reportType, data, 'full');
        return data;
    }, fallback);
};

export const generateDeepPdfReport = async (profile, reportType) => {
    const cacheKey = `${profile.id}_deepreport_${reportType}`;
    const cached = await ReportRepository.getReport(cacheKey);
    if (cached) return cached;

    const astralSig = getAstralSignature(profile);
    const chartData = profile.chart?.planets
        ? profile.chart.planets.map(p => `${p.name}: ${p.sign} ${p.degree.toFixed(0)}° (House ${p.house})${p.isRetrograde ? ' ℞' : ''}`).join('\n')
        : 'Chart data unavailable';

    const aspectData = profile.chart?.aspects
        ? profile.chart.aspects.slice(0, 15).map(a => `${a.planet1} ${a.type} ${a.planet2} (orb ${a.orb.toFixed(1)}°)`).join('\n')
        : '';

    const houses = profile.chart?.houses
        ? Object.entries(profile.chart.houses).slice(0, 12).map(([n, h]) => `House ${n}: ${h.sign} ${h.degree?.toFixed(0)}°`).join('\n')
        : '';

    const elements = profile.chart?.elements || {};
    const modalities = profile.chart?.modalities || {};

    const reportConfig = REPORT_PROMPTS[reportType];
    const focusLine = reportConfig ? `FOCUS: ${reportConfig.focus}\n${reportConfig.instruction}` : '';

    const fallback = {
        headline: "Your Cosmic Blueprint",
        coreMotif: "You are here to transform and illuminate.",
        overview: "Your chart reveals a unique combination of energies.\n\nThe interplay between your placements creates both tension and gifts.\n\nYour cosmic signature speaks of depth and growth.\n\nThis is your invitation to live more consciously.",
        bigThree: {
            sun: { title: "Your Sun Sign", interpretation: "Your Sun represents your core identity and life force.", shadow: "Watch for ego identification with one trait.", advice: "Express your authentic self daily." },
            moon: { title: "Your Moon Sign", interpretation: "Your Moon speaks to your emotional core and needs.", shadow: "Be aware of emotional reactivity.", advice: "Honor your feelings without judgment." },
            rising: { title: "Your Rising Sign", interpretation: "Your Rising shapes how the world first meets you.", shadow: "Don't over-identify with your persona.", advice: "Let your authentic self shine through." },
        },
        planets: [
            { name: "Mercury", placement: "Your Mercury placement", title: "Your Mercury", interpretation: "Mercury shapes your communication style.", advice: "Write your thoughts down regularly." },
            { name: "Venus", placement: "Your Venus placement", title: "Your Venus", interpretation: "Venus colors your approach to love and beauty.", advice: "Cultivate what brings you pleasure." },
        ],
        lifeAreas: {
            love: { theme: "Heart Connections", analysis: "Your chart speaks to deep relational patterns.", advice: "Lead with vulnerability." },
            career: { theme: "Professional Path", analysis: "Your career energy is shaped by unique drives.", advice: "Trust your instincts at work." },
            purpose: { theme: "Soul Mission", analysis: "Your life purpose involves growth and service.", advice: "Follow what lights you up." },
            challenge: { theme: "Growth Edge", analysis: "Your challenges are your greatest teachers.", advice: "Lean into discomfort consciously." },
        },
        soulPath: {
            northNodeMessage: "Your North Node points toward new territory.\n\nThis is where your greatest growth awaits.",
            karmicPatterns: "Your South Node reveals comfortable but limiting patterns.",
            giftToTheWorld: "You are here to share something only you can offer.",
        },
        elementalBalance: { dominantElement: "Mixed", dominantModality: "Mixed", analysis: "Your elemental balance creates a versatile temperament." },
        closing: "Your chart is not a cage — it is a map.\n\nThe stars illuminate possibilities. You choose the path.",
    };

    const prompt = `
        DEEP PREMIUM ASTROLOGY REPORT FOR PDF DOWNLOAD
        Report Type: ${reportType.toUpperCase()}

        ${focusLine}

        USER: ${astralSig}

        FULL CHART PLACEMENTS:
        ${chartData}

        HOUSES:
        ${houses}

        KEY ASPECTS:
        ${aspectData}

        ELEMENTS: Fire ${elements.fire || 0}, Earth ${elements.earth || 0}, Air ${elements.air || 0}, Water ${elements.water || 0}
        MODALITIES: Cardinal ${modalities.cardinal || 0}, Fixed ${modalities.fixed || 0}, Mutable ${modalities.mutable || 0}

        GENERATE A COMPREHENSIVE, MULTI-PAGE REPORT:

        1. HEADLINE: 3-6 word archetypal title (e.g., "The Architect of Inner Worlds")
        2. CORE MOTIF: One profound sentence capturing the soul's theme
        3. OVERVIEW: 4 paragraphs separated by \\n\\n — chart synthesis, internal tensions, unique gifts, life mission. ~400 words total.
        4. BIG THREE: Each of Sun, Moon, Rising gets:
           - title (e.g., "Leo Sun: The Sacred Performer")
           - interpretation (2-3 paragraphs, ~200 words, deeply personal)
           - shadow (1 paragraph on the shadow side, ~60 words)
           - advice (1 practical sentence)
        5. PLANETS: 8 entries (Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto):
           - name, placement (sign + house), title (poetic)
           - interpretation: 2 paragraphs for Mercury-Saturn, 1 paragraph for Uranus-Pluto (house-focused)
           - advice (1 sentence)
        6. LIFE AREAS: 4 areas (love, career, purpose, challenge):
           - theme (3-4 words), analysis (2-3 paragraphs ~200 words), advice (1 sentence)
        7. SOUL PATH:
           - northNodeMessage: 2 paragraphs on evolutionary direction
           - karmicPatterns: 1-2 paragraphs on South Node patterns
           - giftToTheWorld: 1 inspiring paragraph
        8. ELEMENTAL BALANCE:
           - dominantElement, dominantModality, analysis (2 paragraphs)
        9. CLOSING: 2 inspiring paragraphs weaving all themes (~150 words)

        CRITICAL WRITING RULES:
        - EVERY sentence must reference SPECIFIC signs, houses, planets, degrees from their chart
        - "Your Mars in Aries in the 10th house..." NOT "Your Mars placement..."
        - Connect placements: "Your Scorpio Moon squares your Aquarius Sun, creating..."
        - Psychological depth — lived experience, not keywords
        - Warm, wise, empowering tone. Grade 7-8 English.
        - Note retrogrades when present
        - Reference house themes naturally
        - NO generic filler. Every paragraph must be uniquely theirs.

        JSON Only.
    `;

    return withRetry(async () => {
        const response = await generateWithFallback({
            contents: [{ role: 'user', parts: [{ text: prompt }] }],
            config: { responseMimeType: "application/json", responseSchema: deepPdfReportSchema }
        });
        const parsed = cleanAndParseJson(response.text, fallback);
        const data = { ...fallback, ...parsed };
        await ReportRepository.saveReport(cacheKey, profile.id, reportType, data, 'deep_pdf');
        return data;
    }, fallback);
};


