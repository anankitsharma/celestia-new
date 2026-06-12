// ── Per-card gradients — same philosophy as HomeScreenV2 SLOT_GRADIENTS ──
// Light: cream-dominant with a subtle mood wash at the top.
// Dark:  deep rich tone fading to the page dark (#15101A base).
// Each insight type carries its own emotional color, not the role's blanket hero gradient.
export const COMPAT_CARD_GRADIENTS_LIGHT = {
  cover:                  ['#FBE0E8', '#FBEEF1', '#FAF6EE'],   // soft rose — relational bond
  aiAnalysis:             ['#FFEFD9', '#FBF5EE', '#FAF6EE'],   // warm peach — the spark
  dimensions:             ['#EDE2F5', '#F8F0FA', '#FAF6EE'],   // lavender — cosmic overview
  areas:                  ['#F5E1B8', '#F8EED6', '#FAF6EE'],   // gold parchment — deep wisdom
  sharedValues:           ['#E5F0DC', '#F4F8EE', '#FAF6EE'],   // sage — growth & nature
  keyConnections:         ['#E0E8F2', '#F2F4F8', '#FAF6EE'],   // cool sky — astro links
  loveLanguages:          ['#FBE5DD', '#FBF1EC', '#FAF6EE'],   // rose-pink — love & warmth
  conflictStyle:          ['#F5E5E0', '#FBF0EC', '#FAF6EE'],   // warm ember — tension
  friendshipDynamic:      ['#EDE0F0', '#F8F2FA', '#FAF6EE'],   // violet — social energy
  adventureCompat:        ['#E5F0DC', '#F4F8EE', '#FAF6EE'],   // sage — vitality & travel
  generationalPattern:    ['#EDE6D8', '#F4EEDF', '#FAF6EE'],   // ivory — history & roots
  communicationGuide:     ['#E6EAF2', '#F4F6F9', '#FAF6EE'],   // pewter-blue — Mercury
  communicationPlaybook:  ['#E6EAF2', '#F4F6F9', '#FAF6EE'],   // pewter-blue — Mercury
  healingPath:            ['#EDE6D8', '#F4EEDF', '#FAF6EE'],   // ivory — healing & depth
  siblingDynamic:         ['#FBE3B5', '#FAF1DC', '#FAF6EE'],   // amber — sibling warmth
  careerStrategy:         ['#E6EAF2', '#F4F6F9', '#FAF6EE'],   // pewter-blue — professional
  teamworkProfile:        ['#E6EAF2', '#F4F6F9', '#FAF6EE'],   // pewter-blue — teamwork
  parentingGuide:         ['#E5F0DC', '#F4F8EE', '#FAF6EE'],   // sage — nurturing
  childNature:            ['#E5F0DC', '#F4F8EE', '#FAF6EE'],   // sage — child's nature
  relationshipSeason:     ['#FBE9CD', '#FAF3E2', '#FAF6EE'],   // dusk amber — timing
  activeWindows:          ['#FBE9CD', '#FAF3E2', '#FAF6EE'],   // dusk amber — active energy
  actions:                ['#FBE3B5', '#FAF1DC', '#FAF6EE'],   // amber — forward motion
};

export const COMPAT_CARD_GRADIENTS_DARK = {
  cover:                  ['#5A283A', '#3A1A28', '#1F0F18'],   // deep rose
  aiAnalysis:             ['#7A2840', '#3A1A28', '#1F0F18'],   // deep warm crimson
  dimensions:             ['#3A2840', '#3A1A28', '#1F0F18'],   // deep violet
  areas:                  ['#3A2818', '#3A1A28', '#1F0F18'],   // deep gold/brown
  sharedValues:           ['#2A3828', '#3A1A28', '#1F0F18'],   // deep sage
  keyConnections:         ['#3A2A48', '#3A1A28', '#1F0F18'],   // deep sky blue
  loveLanguages:          ['#7A2A40', '#5A2840', '#1F0F18'],   // deep rose-pink
  conflictStyle:          ['#482020', '#3A1A28', '#1F0F18'],   // deep ember
  friendshipDynamic:      ['#3A2840', '#3A1A28', '#1F0F18'],   // deep violet
  adventureCompat:        ['#2A3828', '#3A1A28', '#1F0F18'],   // deep sage
  generationalPattern:    ['#48342A', '#3A1A28', '#1F0F18'],   // deep ivory/brown
  communicationGuide:     ['#2A2A40', '#3A1A28', '#1F0F18'],   // deep blue
  communicationPlaybook:  ['#2A2A40', '#3A1A28', '#1F0F18'],   // deep blue
  healingPath:            ['#48342A', '#3A1A28', '#1F0F18'],   // deep warm
  siblingDynamic:         ['#3A2818', '#3A1A28', '#1F0F18'],   // deep amber
  careerStrategy:         ['#2A2A40', '#3A1A28', '#1F0F18'],   // deep blue-grey
  teamworkProfile:        ['#2A2A40', '#3A1A28', '#1F0F18'],   // deep blue-grey
  parentingGuide:         ['#2A3828', '#3A1A28', '#1F0F18'],   // deep sage
  childNature:            ['#2A3828', '#3A1A28', '#1F0F18'],   // deep sage
  relationshipSeason:     ['#3A2818', '#3A1A28', '#1F0F18'],   // deep amber
  activeWindows:          ['#3A2818', '#3A1A28', '#1F0F18'],   // deep amber
  actions:                ['#3A2818', '#3A1A28', '#1F0F18'],   // deep amber
};

// Accent color per section key — used for bars, chips, and highlights in detail modal
export const COMPAT_CARD_ACCENTS = {
  cover:                  '#E85090',
  aiAnalysis:             '#E89050',
  dimensions:             '#9080D0',
  areas:                  '#C8A84B',
  sharedValues:           '#6A9060',
  keyConnections:         '#7090C8',
  loveLanguages:          '#E85090',
  conflictStyle:          '#E86050',
  friendshipDynamic:      '#9060C0',
  adventureCompat:        '#6A9060',
  generationalPattern:    '#C8A060',
  communicationGuide:     '#6080C8',
  communicationPlaybook:  '#6080C8',
  healingPath:            '#C8A060',
  siblingDynamic:         '#E8A050',
  careerStrategy:         '#50A0C8',
  teamworkProfile:        '#50C8A0',
  parentingGuide:         '#7EC8A0',
  childNature:            '#7EC8A0',
  relationshipSeason:     '#C8A84B',
  activeWindows:          '#C8A84B',
  actions:                '#C8A84B',
};

export const ZODIAC_GLYPHS = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
};

export const RELATIONSHIP_TYPES = [
  { key: 'partner', label: 'Partner', icon: '♡' },
  { key: 'ex', label: 'Ex', icon: '💔' },
  { key: 'friend', label: 'Best Friend', icon: '★' },
  { key: 'parent', label: 'Parent', icon: '◎' },
  { key: 'sibling', label: 'Sibling', icon: '◇' },
  { key: 'boss', label: 'Boss', icon: '◆' },
  { key: 'colleague', label: 'Colleague', icon: '✧' },
  { key: 'child', label: 'Child', icon: '☽' },
  { key: 'other', label: 'Other', icon: '✦' },
];

export const ROLE_LABELS = {};
RELATIONSHIP_TYPES.forEach(r => { ROLE_LABELS[r.key] = r; });

export const CATEGORY_GROUPS = [
  { key: 'love', label: 'LOVE', roles: ['partner', 'ex'], gradient: ['#2D0A1E', '#1A0828'], icon: '♡' },
  { key: 'family', label: 'FAMILY', roles: ['parent', 'sibling', 'child'], gradient: ['#1A1A08', '#14120A'], icon: '◎' },
  { key: 'friends', label: 'FRIENDS', roles: ['friend'], gradient: ['#0E0A28', '#3A1A28'], icon: '★' },
  { key: 'work', label: 'WORK', roles: ['boss', 'colleague'], gradient: ['#081A28', '#0A1420'], icon: '◆' },
  { key: 'other', label: 'OTHER', roles: ['other'], gradient: ['#141210', '#0E0E0E'], icon: '✦' },
];
