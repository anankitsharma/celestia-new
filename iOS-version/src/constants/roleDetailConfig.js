// Role-specific detail screen configurations
// Each role type gets customized sections, labels, gradients, and score vocabulary

const getPartnerScoreLabel = (s) => {
  if (s >= 90) return 'Written in the stars';
  if (s >= 80) return 'Deeply harmonious';
  if (s >= 70) return 'Strong connection';
  if (s >= 60) return 'Compatible souls';
  if (s >= 50) return 'Growing together';
  return 'Complex dynamic';
};

const getFriendScoreLabel = (s) => {
  if (s >= 90) return 'Cosmic best friends';
  if (s >= 80) return 'Soul-level bond';
  if (s >= 70) return 'Solid crew';
  if (s >= 60) return 'Good vibes';
  if (s >= 50) return 'Growing bond';
  return 'Learning curve';
};

const getParentScoreLabel = (s) => {
  if (s >= 90) return 'Deep roots';
  if (s >= 80) return 'Strong foundation';
  if (s >= 70) return 'Growing closer';
  if (s >= 60) return 'Building bridges';
  if (s >= 50) return 'Working through it';
  return 'Learning each other';
};

const getSiblingScoreLabel = (s) => {
  if (s >= 90) return 'Cosmic twins';
  if (s >= 80) return 'Built-in allies';
  if (s >= 70) return 'Balanced bond';
  if (s >= 60) return 'Complementary forces';
  if (s >= 50) return 'Finding your rhythm';
  return 'Different planets';
};

const getBossScoreLabel = (s) => {
  if (s >= 90) return 'Career catalyst';
  if (s >= 80) return 'Strong alignment';
  if (s >= 70) return 'Solid dynamic';
  if (s >= 60) return 'Workable flow';
  if (s >= 50) return 'Room to navigate';
  return 'Strategic approach needed';
};

const getColleagueScoreLabel = (s) => {
  if (s >= 90) return 'Dream team';
  if (s >= 80) return 'Strong synergy';
  if (s >= 70) return 'Good collaboration';
  if (s >= 60) return 'Productive dynamic';
  if (s >= 50) return 'Finding flow';
  return 'Different approaches';
};

const getChildScoreLabel = (s) => {
  if (s >= 90) return 'Heart connection';
  if (s >= 80) return 'Beautiful bond';
  if (s >= 70) return 'Growing together';
  if (s >= 60) return 'Learning their language';
  if (s >= 50) return 'Building understanding';
  return 'Different frequencies';
};

export const ROLE_DETAIL_CONFIG = {
  partner: {
    // V1.2 — Light Liquid Glass: warm rose for love/intimacy.
    heroGradient: ['#FBEFE8', '#F8E8DD', '#F4DFD0'],
    getScoreLabel: getPartnerScoreLabel,
    sectionOrder: [
      'aiAnalysis',
      'dimensions',
      'loveLanguages',
      'relationshipSeason',
      'activeWindows',
      'areas',
      'conflictStyle',
      'sharedValues',
      'keyConnections',
      'actionRow',
      'pdfDownload',
    ],
    labels: {
      aiAnalysis: 'YOUR LOVE STORY',
      dimensions: 'CHEMISTRY BREAKDOWN',
      areas: 'RELATIONSHIP DYNAMICS',
      sharedValues: 'SHARED VALUES',
      keyConnections: 'DEEPER PATTERNS',
      pdfTitle: 'Download Love Report',
      pdfSub: 'Love languages, conflict styles, and long-term forecast',
    },
  },

  friend: {
    // V1.2 — Light Liquid Glass: lavender-mauve for warmth/connection.
    heroGradient: ['#F0EAEE', '#E8DFE5', '#E0D4DC'],
    getScoreLabel: getFriendScoreLabel,
    sectionOrder: [
      'aiAnalysis',
      'dimensions',
      'friendshipDynamic',
      'relationshipSeason',
      'activeWindows',
      'areas',
      'adventureCompat',
      'sharedValues',
      'keyConnections',
      'actionRow',
      'pdfDownload',
    ],
    labels: {
      aiAnalysis: 'YOUR FRIENDSHIP VIBE',
      dimensions: 'FRIENDSHIP BLUEPRINT',
      areas: 'HOW YOU CONNECT',
      sharedValues: 'WHAT BONDS YOU',
      keyConnections: 'KEY CONNECTIONS',
      pdfTitle: 'Download Friendship Report',
      pdfSub: 'Trust dynamics, adventure compatibility, and growth potential',
    },
  },

  parent: {
    // V1.2 — Light Liquid Glass: warm sand for nurture/grounding.
    heroGradient: ['#F4ECDD', '#F0E5CF', '#EBDDC0'],
    getScoreLabel: getParentScoreLabel,
    sectionOrder: [
      'aiAnalysis',
      'dimensions',
      'generationalPattern',
      'communicationGuide',
      'relationshipSeason',
      'activeWindows',
      'areas',
      'healingPath',
      'keyConnections',
      'actionRow',
      'pdfDownload',
    ],
    labels: {
      aiAnalysis: 'UNDERSTANDING YOUR BOND',
      dimensions: 'CONNECTION BLUEPRINT',
      areas: 'RELATIONSHIP DYNAMICS',
      sharedValues: 'COMMON GROUND',
      keyConnections: 'DEEPER PATTERNS',
      pdfTitle: 'Download Family Report',
      pdfSub: 'Communication styles, generational patterns, and healing paths',
    },
  },

  sibling: {
    // V1.2 — Light Liquid Glass: warm champagne for shared family.
    heroGradient: ['#F1EAD8', '#EDE2C8', '#E9DAB8'],
    getScoreLabel: getSiblingScoreLabel,
    sectionOrder: [
      'aiAnalysis',
      'dimensions',
      'siblingDynamic',
      'relationshipSeason',
      'activeWindows',
      'areas',
      'sharedValues',
      'keyConnections',
      'actionRow',
      'pdfDownload',
    ],
    labels: {
      aiAnalysis: 'YOUR SIBLING STORY',
      dimensions: 'SIBLING BLUEPRINT',
      areas: 'HOW YOU RELATE',
      sharedValues: 'COMMON GROUND',
      keyConnections: 'DEEPER PATTERNS',
      pdfTitle: 'Download Sibling Report',
      pdfSub: 'Bond dynamics, shared growth, and alliance potential',
    },
  },

  boss: {
    // V1.2 — Light Liquid Glass: cool pewter for professional context.
    heroGradient: ['#EEF1F2', '#E8ECEE', '#E2E7EA'],
    getScoreLabel: getBossScoreLabel,
    sectionOrder: [
      'aiAnalysis',
      'dimensions',
      'communicationPlaybook',
      'relationshipSeason',
      'activeWindows',
      'areas',
      'careerStrategy',
      'keyConnections',
      'actionRow',
      'pdfDownload',
    ],
    labels: {
      aiAnalysis: 'WORKING DYNAMIC',
      dimensions: 'PROFESSIONAL ALIGNMENT',
      areas: 'WORK COMPATIBILITY',
      sharedValues: 'SHARED WORK VALUES',
      keyConnections: 'PROFESSIONAL LINKS',
      pdfTitle: 'Download Work Report',
      pdfSub: 'Communication tactics, growth opportunities, and timing insights',
    },
  },

  colleague: {
    // V1.2 — Light Liquid Glass: cool pewter (matches boss).
    heroGradient: ['#EEF1F2', '#E8ECEE', '#E2E7EA'],
    getScoreLabel: getColleagueScoreLabel,
    sectionOrder: [
      'aiAnalysis',
      'dimensions',
      'teamworkProfile',
      'relationshipSeason',
      'activeWindows',
      'areas',
      'sharedValues',
      'keyConnections',
      'actionRow',
      'pdfDownload',
    ],
    labels: {
      aiAnalysis: 'COLLABORATION PROFILE',
      dimensions: 'TEAMWORK BLUEPRINT',
      areas: 'WORK SYNERGY',
      sharedValues: 'SHARED WORK VALUES',
      keyConnections: 'PROFESSIONAL LINKS',
      pdfTitle: 'Download Teamwork Report',
      pdfSub: 'Collaboration style, project dynamics, and innovation potential',
    },
  },

  child: {
    // V1.2 — Light Liquid Glass: warm sage for growth.
    heroGradient: ['#ECF1E5', '#E4ECDB', '#DCE5CC'],
    getScoreLabel: getChildScoreLabel,
    sectionOrder: [
      'aiAnalysis',
      'dimensions',
      'parentingGuide',
      'childNature',
      'relationshipSeason',
      'activeWindows',
      'areas',
      'keyConnections',
      'actionRow',
      'pdfDownload',
    ],
    labels: {
      aiAnalysis: 'YOUR PARENTING BOND',
      dimensions: 'NURTURING BLUEPRINT',
      areas: 'CONNECTION AREAS',
      sharedValues: 'SHARED VALUES',
      keyConnections: 'DEEPER PATTERNS',
      pdfTitle: 'Download Parenting Report',
      pdfSub: 'Their emotional needs, communication style, and nurturing approach',
    },
  },

  other: {
    // V1.2 — Light Liquid Glass: ivory for neutral.
    heroGradient: ['#F4ECE5', '#F0E4DC', '#ECDCD3'],
    getScoreLabel: getPartnerScoreLabel,
    sectionOrder: [
      'aiAnalysis',
      'dimensions',
      'relationshipSeason',
      'activeWindows',
      'areas',
      'sharedValues',
      'keyConnections',
      'actionRow',
      'pdfDownload',
    ],
    labels: {
      aiAnalysis: 'AI ANALYSIS',
      dimensions: 'COMPATIBILITY DIMENSIONS',
      areas: 'RELATIONSHIP AREAS',
      sharedValues: 'SHARED VALUES',
      keyConnections: 'KEY CONNECTIONS',
      pdfTitle: 'Download Full Report',
      pdfSub: 'Communication styles, growth areas, and connection insights',
    },
  },
};
