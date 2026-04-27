import { PlanetName } from '../../types';
import { SIGN_MODALITIES, SIGN_ELEMENTS } from '../../constants/AstrologyCore';

// Role-specific dimension definitions
// Each role maps to 4 scored dimensions with underlying planetary pairs
export const ROLE_DIMENSIONS = {
    partner: {
        dims: [
            { key: 'emotional', label: 'Emotional', color: '#E85090', icon: '☽' },
            { key: 'attraction', label: 'Attraction', color: '#E86050', icon: '♀' },
            { key: 'communication', label: 'Communication', color: '#50A0C8', icon: '☿' },
            { key: 'stability', label: 'Stability', color: '#C8A84B', icon: '♄' },
        ],
        planetPairs: {
            emotional: [[PlanetName.Moon, PlanetName.Moon], [PlanetName.Moon, PlanetName.Venus], [PlanetName.Moon, PlanetName.Sun], [PlanetName.Venus, PlanetName.Venus]],
            attraction: [[PlanetName.Venus, PlanetName.Mars], [PlanetName.Venus, PlanetName.Sun], [PlanetName.Mars, PlanetName.Moon], [PlanetName.Venus, PlanetName.Ascendant]],
            communication: [[PlanetName.Mercury, PlanetName.Mercury], [PlanetName.Mercury, PlanetName.Moon], [PlanetName.Mercury, PlanetName.Sun], [PlanetName.Mercury, PlanetName.Jupiter]],
            stability: [[PlanetName.Saturn, PlanetName.Sun], [PlanetName.Saturn, PlanetName.Moon], [PlanetName.Jupiter, PlanetName.Saturn], [PlanetName.Saturn, PlanetName.Venus]],
        },
    },
    ex: {
        dims: [
            { key: 'attraction', label: 'What Drew You In', color: '#E86050', icon: '♀' },
            { key: 'emotional', label: 'Emotional Bond', color: '#E85090', icon: '☽' },
            { key: 'tension', label: 'Where It Broke', color: '#C060E0', icon: '♂' },
            { key: 'lesson', label: 'What You Learned', color: '#B080F0', icon: '♄' },
        ],
        planetPairs: {
            attraction: [[PlanetName.Venus, PlanetName.Mars], [PlanetName.Venus, PlanetName.Sun], [PlanetName.Mars, PlanetName.Moon], [PlanetName.Venus, PlanetName.Ascendant]],
            emotional: [[PlanetName.Moon, PlanetName.Moon], [PlanetName.Moon, PlanetName.Venus], [PlanetName.Moon, PlanetName.Sun], [PlanetName.Venus, PlanetName.Venus]],
            tension: [[PlanetName.Mars, PlanetName.Mars], [PlanetName.Saturn, PlanetName.Venus], [PlanetName.Saturn, PlanetName.Moon], [PlanetName.Mars, PlanetName.Saturn]],
            lesson: [[PlanetName.Saturn, PlanetName.Sun], [PlanetName.NorthNode, PlanetName.Sun], [PlanetName.NorthNode, PlanetName.Moon], [PlanetName.Jupiter, PlanetName.Saturn]],
        },
    },
    friend: {
        dims: [
            { key: 'trust', label: 'Trust', color: '#7EC8A0', icon: '♄' },
            { key: 'fun', label: 'Fun & Energy', color: '#E8A050', icon: '♃' },
            { key: 'communication', label: 'Communication', color: '#50A0C8', icon: '☿' },
            { key: 'growth', label: 'Growth', color: '#B080F0', icon: '♃' },
        ],
        planetPairs: {
            trust: [[PlanetName.Saturn, PlanetName.Moon], [PlanetName.Saturn, PlanetName.Sun], [PlanetName.Moon, PlanetName.Moon], [PlanetName.Saturn, PlanetName.Venus]],
            fun: [[PlanetName.Jupiter, PlanetName.Sun], [PlanetName.Jupiter, PlanetName.Moon], [PlanetName.Mars, PlanetName.Mars], [PlanetName.Venus, PlanetName.Venus]],
            communication: [[PlanetName.Mercury, PlanetName.Mercury], [PlanetName.Mercury, PlanetName.Moon], [PlanetName.Mercury, PlanetName.Sun], [PlanetName.Mercury, PlanetName.Jupiter]],
            growth: [[PlanetName.Jupiter, PlanetName.Sun], [PlanetName.Jupiter, PlanetName.Moon], [PlanetName.NorthNode, PlanetName.Sun], [PlanetName.NorthNode, PlanetName.Moon]],
        },
    },
    parent: {
        dims: [
            { key: 'understanding', label: 'Understanding', color: '#E85090', icon: '☽' },
            { key: 'support', label: 'Support', color: '#7EC8A0', icon: '♃' },
            { key: 'communication', label: 'Communication', color: '#50A0C8', icon: '☿' },
            { key: 'boundaries', label: 'Boundaries', color: '#C8A84B', icon: '♄' },
        ],
        planetPairs: {
            understanding: [[PlanetName.Moon, PlanetName.Moon], [PlanetName.Moon, PlanetName.Sun], [PlanetName.Venus, PlanetName.Moon], [PlanetName.Moon, PlanetName.Ascendant]],
            support: [[PlanetName.Jupiter, PlanetName.Moon], [PlanetName.Jupiter, PlanetName.Sun], [PlanetName.Venus, PlanetName.Venus], [PlanetName.Jupiter, PlanetName.Venus]],
            communication: [[PlanetName.Mercury, PlanetName.Mercury], [PlanetName.Mercury, PlanetName.Moon], [PlanetName.Mercury, PlanetName.Sun], [PlanetName.Mercury, PlanetName.Jupiter]],
            boundaries: [[PlanetName.Saturn, PlanetName.Sun], [PlanetName.Saturn, PlanetName.Moon], [PlanetName.Saturn, PlanetName.Mars], [PlanetName.Saturn, PlanetName.Venus]],
        },
    },
    sibling: {
        dims: [
            { key: 'bond', label: 'Bond', color: '#E85090', icon: '☽' },
            { key: 'communication', label: 'Communication', color: '#50A0C8', icon: '☿' },
            { key: 'sharedGrowth', label: 'Shared Growth', color: '#B080F0', icon: '♃' },
            { key: 'support', label: 'Support', color: '#7EC8A0', icon: '♄' },
        ],
        planetPairs: {
            bond: [[PlanetName.Moon, PlanetName.Moon], [PlanetName.Sun, PlanetName.Sun], [PlanetName.Venus, PlanetName.Venus], [PlanetName.Moon, PlanetName.Sun]],
            communication: [[PlanetName.Mercury, PlanetName.Mercury], [PlanetName.Mercury, PlanetName.Moon], [PlanetName.Mercury, PlanetName.Sun], [PlanetName.Mercury, PlanetName.Jupiter]],
            sharedGrowth: [[PlanetName.Jupiter, PlanetName.Sun], [PlanetName.Jupiter, PlanetName.Moon], [PlanetName.NorthNode, PlanetName.Sun], [PlanetName.NorthNode, PlanetName.Moon]],
            support: [[PlanetName.Saturn, PlanetName.Moon], [PlanetName.Saturn, PlanetName.Sun], [PlanetName.Jupiter, PlanetName.Saturn], [PlanetName.Saturn, PlanetName.Venus]],
        },
    },
    boss: {
        dims: [
            { key: 'respect', label: 'Respect', color: '#C8A84B', icon: '♄' },
            { key: 'workSync', label: 'Work Sync', color: '#50A0C8', icon: '♂' },
            { key: 'communication', label: 'Communication', color: '#E8A050', icon: '☿' },
            { key: 'growth', label: 'Growth', color: '#B080F0', icon: '♃' },
        ],
        planetPairs: {
            respect: [[PlanetName.Saturn, PlanetName.Sun], [PlanetName.Saturn, PlanetName.Moon], [PlanetName.Sun, PlanetName.Sun], [PlanetName.Saturn, PlanetName.Mars]],
            workSync: [[PlanetName.Mars, PlanetName.Mars], [PlanetName.Mars, PlanetName.Sun], [PlanetName.Mars, PlanetName.Saturn], [PlanetName.Sun, PlanetName.Ascendant]],
            communication: [[PlanetName.Mercury, PlanetName.Mercury], [PlanetName.Mercury, PlanetName.Moon], [PlanetName.Mercury, PlanetName.Sun], [PlanetName.Mercury, PlanetName.Jupiter]],
            growth: [[PlanetName.Jupiter, PlanetName.Sun], [PlanetName.Jupiter, PlanetName.Moon], [PlanetName.NorthNode, PlanetName.Sun], [PlanetName.Jupiter, PlanetName.Venus]],
        },
    },
    colleague: {
        dims: [
            { key: 'workSync', label: 'Work Sync', color: '#50A0C8', icon: '♂' },
            { key: 'communication', label: 'Communication', color: '#E8A050', icon: '☿' },
            { key: 'innovation', label: 'Innovation', color: '#B080F0', icon: '♅' },
            { key: 'trust', label: 'Trust', color: '#7EC8A0', icon: '♄' },
        ],
        planetPairs: {
            workSync: [[PlanetName.Mars, PlanetName.Mars], [PlanetName.Mars, PlanetName.Sun], [PlanetName.Sun, PlanetName.Sun], [PlanetName.Mars, PlanetName.Saturn]],
            communication: [[PlanetName.Mercury, PlanetName.Mercury], [PlanetName.Mercury, PlanetName.Moon], [PlanetName.Mercury, PlanetName.Sun], [PlanetName.Mercury, PlanetName.Jupiter]],
            innovation: [[PlanetName.Jupiter, PlanetName.Sun], [PlanetName.Jupiter, PlanetName.Mercury], [PlanetName.NorthNode, PlanetName.Mercury], [PlanetName.Jupiter, PlanetName.Moon]],
            trust: [[PlanetName.Saturn, PlanetName.Moon], [PlanetName.Saturn, PlanetName.Sun], [PlanetName.Moon, PlanetName.Moon], [PlanetName.Saturn, PlanetName.Venus]],
        },
    },
    child: {
        dims: [
            { key: 'nurturing', label: 'Nurturing', color: '#E85090', icon: '☽' },
            { key: 'understanding', label: 'Understanding', color: '#7EC8A0', icon: '♀' },
            { key: 'communication', label: 'Communication', color: '#50A0C8', icon: '☿' },
            { key: 'bond', label: 'Bond', color: '#C8A84B', icon: '☉' },
        ],
        planetPairs: {
            nurturing: [[PlanetName.Moon, PlanetName.Moon], [PlanetName.Moon, PlanetName.Venus], [PlanetName.Moon, PlanetName.Sun], [PlanetName.Venus, PlanetName.Venus]],
            understanding: [[PlanetName.Moon, PlanetName.Sun], [PlanetName.Venus, PlanetName.Moon], [PlanetName.Sun, PlanetName.Ascendant], [PlanetName.Moon, PlanetName.Ascendant]],
            communication: [[PlanetName.Mercury, PlanetName.Mercury], [PlanetName.Mercury, PlanetName.Moon], [PlanetName.Mercury, PlanetName.Sun], [PlanetName.Mercury, PlanetName.Jupiter]],
            bond: [[PlanetName.Sun, PlanetName.Sun], [PlanetName.Moon, PlanetName.Moon], [PlanetName.Jupiter, PlanetName.Moon], [PlanetName.Jupiter, PlanetName.Sun]],
        },
    },
    other: {
        dims: [
            { key: 'emotional', label: 'Emotional', color: '#E85090', icon: '☽' },
            { key: 'communication', label: 'Communication', color: '#50A0C8', icon: '☿' },
            { key: 'growth', label: 'Growth', color: '#B080F0', icon: '♃' },
            { key: 'stability', label: 'Stability', color: '#C8A84B', icon: '♄' },
        ],
        planetPairs: {
            emotional: [[PlanetName.Moon, PlanetName.Moon], [PlanetName.Moon, PlanetName.Venus], [PlanetName.Moon, PlanetName.Sun], [PlanetName.Venus, PlanetName.Venus]],
            communication: [[PlanetName.Mercury, PlanetName.Mercury], [PlanetName.Mercury, PlanetName.Moon], [PlanetName.Mercury, PlanetName.Sun], [PlanetName.Mercury, PlanetName.Jupiter]],
            growth: [[PlanetName.Jupiter, PlanetName.Sun], [PlanetName.Jupiter, PlanetName.Moon], [PlanetName.NorthNode, PlanetName.Sun], [PlanetName.NorthNode, PlanetName.Moon]],
            stability: [[PlanetName.Saturn, PlanetName.Sun], [PlanetName.Saturn, PlanetName.Moon], [PlanetName.Jupiter, PlanetName.Saturn], [PlanetName.Saturn, PlanetName.Venus]],
        },
    },
};

// Orb colors by relationship type
export const ROLE_COLORS = {
    partner: { bg: ['#E85090', '#C82870'], soft: 'rgba(232,80,144,0.12)' },
    ex: { bg: ['#A88BA0', '#7C5C70'], soft: 'rgba(168,139,160,0.12)' },
    friend: { bg: ['#9060E0', '#6040B0'], soft: 'rgba(144,96,224,0.12)' },
    parent: { bg: ['#C8A84B', '#8C6C18'], soft: 'rgba(200,168,75,0.12)' },
    sibling: { bg: ['#E8A050', '#C07830'], soft: 'rgba(232,160,80,0.12)' },
    boss: { bg: ['#50A0C8', '#3070A0'], soft: 'rgba(80,160,200,0.12)' },
    colleague: { bg: ['#50A0C8', '#3070A0'], soft: 'rgba(80,160,200,0.12)' },
    child: { bg: ['#7EC8A0', '#50A070'], soft: 'rgba(126,200,160,0.12)' },
    other: { bg: ['#97907F', '#706858'], soft: 'rgba(151,144,127,0.12)' },
};

const SCORING = {
    DESTINY_SIGN: 5,
    MAJOR_ASPECT_HIGH_PRECISION: 11,
    MAJOR_ASPECT_STANDARD: 8,
    MINOR_ASPECT: 4,
    HIGH_PRECISION_ORB: 2
};

const DISCEPOLO_ORBS = {
    Conjunction: 8,
    Opposition: 8,
    Trine: 7,
    Square: 5,
    Sextile: 4
};

const MAJOR_ASPECTS = ['Conjunction', 'Opposition', 'Square', 'Trine', 'Sextile'];
const HARD_ASPECTS = ['Square', 'Opposition'];

const getAspect = (deg1, deg2) => {
    let diff = Math.abs(deg1 - deg2);
    if (diff > 180) diff = 360 - diff;

    for (const type of MAJOR_ASPECTS) {
        const limit = DISCEPOLO_ORBS[type];
        let angleRef = 0;
        switch (type) {
            case 'Conjunction': angleRef = 0; break;
            case 'Opposition': angleRef = 180; break;
            case 'Trine': angleRef = 120; break;
            case 'Square': angleRef = 90; break;
            case 'Sextile': angleRef = 60; break;
        }
        if (Math.abs(diff - angleRef) <= limit) {
            return { type, angle: diff, orb: Math.abs(diff - angleRef) };
        }
    }
    return null;
};

export const calculateSynastryScore = (chart1, chart2, role = 'partner') => {
    const breakdown = [];
    let scoreValue = 0;
    let isDestinySign = false;

    const sun1 = chart1.planets.find(p => p.name === PlanetName.Sun);
    const sun2 = chart2.planets.find(p => p.name === PlanetName.Sun);

    if (sun1 && sun2) {
        const quality1 = SIGN_MODALITIES[sun1.sign];
        const quality2 = SIGN_MODALITIES[sun2.sign];
        if (quality1 === quality2) {
            isDestinySign = true;
            scoreValue += SCORING.DESTINY_SIGN;
            breakdown.push({
                rule: 'destiny_sign',
                description: `Destiny Sign: Both are ${quality1}`,
                points: SCORING.DESTINY_SIGN,
                details: `${sun1.sign} - ${sun2.sign}`
            });
        }
    }

    const aspectsFound = [];
    const links = [];

    chart1.planets.forEach(p1 => {
        chart2.planets.forEach(p2 => {
            const aspect = getAspect(p1.absDegree, p2.absDegree);
            if (!aspect) return;

            aspectsFound.push({ planet1: p1.name, planet2: p2.name, type: aspect.type, angle: aspect.angle, orb: aspect.orb });

            let points = 0;
            let rule = '';
            let desc = '';
            const p1Name = p1.name;
            const p2Name = p2.name;
            const type = aspect.type;
            const orb = aspect.orb;
            const isHighPrecision = orb <= SCORING.HIGH_PRECISION_ORB;

            if (p1Name === PlanetName.Sun && p2Name === PlanetName.Sun) {
                if (['Conjunction', 'Opposition', 'Square'].includes(type)) {
                    points = isHighPrecision ? SCORING.MAJOR_ASPECT_HIGH_PRECISION : SCORING.MAJOR_ASPECT_STANDARD;
                    rule = 'sun_sun_major'; desc = `Sun-Sun ${type}`;
                } else {
                    points = SCORING.MINOR_ASPECT; rule = 'sun_sun_minor'; desc = `Sun-Sun ${type}`;
                }
            } else if ((p1Name === PlanetName.Sun && p2Name === PlanetName.Moon) || (p1Name === PlanetName.Moon && p2Name === PlanetName.Sun)) {
                if (type === 'Conjunction') {
                    points = isHighPrecision ? SCORING.MAJOR_ASPECT_HIGH_PRECISION : SCORING.MAJOR_ASPECT_STANDARD;
                    rule = 'sun_moon_conjunction'; desc = 'Sun-Moon Conjunction';
                } else {
                    points = SCORING.MINOR_ASPECT; rule = 'sun_moon_other'; desc = `Sun-Moon ${type}`;
                }
            } else if ((p1Name === PlanetName.Sun && p2Name === PlanetName.Ascendant) || (p1Name === PlanetName.Ascendant && p2Name === PlanetName.Sun)) {
                points = SCORING.MINOR_ASPECT; rule = 'sun_ascendant'; desc = `Sun-Ascendant ${type}`;
            } else if ((p1Name === PlanetName.Moon && p2Name === PlanetName.Ascendant) || (p1Name === PlanetName.Ascendant && p2Name === PlanetName.Moon)) {
                points = SCORING.MINOR_ASPECT; rule = 'moon_ascendant'; desc = `Moon-Ascendant ${type}`;
            } else if ((p1Name === PlanetName.Venus && p2Name === PlanetName.Mars) || (p1Name === PlanetName.Mars && p2Name === PlanetName.Venus)) {
                points = SCORING.MINOR_ASPECT; rule = 'venus_mars'; desc = `Venus-Mars ${type}`;
            }

            if (points > 0) {
                scoreValue += points;
                breakdown.push({
                    rule, description: desc + (isHighPrecision && points > 4 ? ' (Exact)' : ''),
                    points, details: `${p1Name}-${p2Name} ${type} (${orb.toFixed(2)}°)`
                });
            }

            const majorPlanets = [PlanetName.Sun, PlanetName.Moon, PlanetName.Venus, PlanetName.Mars, PlanetName.Mercury, PlanetName.Ascendant, PlanetName.Saturn, PlanetName.Jupiter];
            if (majorPlanets.includes(p1Name) && majorPlanets.includes(p2Name)) {
                links.push({
                    p1: p1Name, p2: p2Name, type, category: 'chemistry',
                    label: `${p1Name}-${p2Name}`, description: type,
                    isFriction: HARD_ASPECTS.includes(type), orb
                });
            }
        });
    });

    let category = 'Minimal';
    if (scoreValue >= 30) category = 'Rare Exceptional';
    else if (scoreValue >= 20) category = 'Exceptional';
    else if (scoreValue >= 15) category = 'Very Important';
    else if (scoreValue >= 10) category = 'Important';
    else if (scoreValue >= 5) category = 'Medium';

    // V1.2 — HONEST MATH:
    // Each dimension is computed from its own planet pairs.
    // Match-quality bonuses (destiny sign + element compat) lift every dimension.
    // The top harmonyScore is the AVERAGE of dimension scores, not a separate
    // inflated curve. What the user sees in the breakdown adds up to the total.

    // Element compatibility (Fire-Air, Earth-Water are complementary).
    const ELEMENT_COMPAT = { Fire: 'Air', Air: 'Fire', Earth: 'Water', Water: 'Earth' };
    let matchQualityBoost = 0;
    if (isDestinySign) matchQualityBoost += 5;
    if (sun1 && sun2) {
        const elem1 = SIGN_ELEMENTS[sun1.sign];
        const elem2 = SIGN_ELEMENTS[sun2.sign];
        if (elem1 === elem2) matchQualityBoost += 5;
        else if (ELEMENT_COMPAT[elem1] === elem2) matchQualityBoost += 3;
    }
    // Inter-aspect density bonus — denser charts feel more "live" overall.
    const densityBoost = Math.min(6, aspectsFound.length * 0.4);

    const aspectPoints = { Conjunction: 4, Trine: 3, Sextile: 2, Square: 1, Opposition: 1 };

    // Calibrate one dimension's raw aspect-percent into a UI band of 50-92.
    // Real-world chart pairs hit 1-2 of 4 pairs typically, so percent of max
    // sits 15-50%. We compress that into a positive-feeling 50-92 band so a
    // typical match feels valuable but a strong match still stands out.
    const calibrateDim = (rawScore, maxPossible) => {
        const pct = maxPossible > 0 ? (rawScore / maxPossible) * 100 : 0;
        // Piecewise curve: 0%→55, 25%→68, 50%→78, 75%→86, 100%→92
        if (pct <= 25) return 55 + (pct / 25) * 13;
        if (pct <= 50) return 68 + ((pct - 25) / 25) * 10;
        if (pct <= 75) return 78 + ((pct - 50) / 25) * 8;
        return 86 + Math.min(6, ((pct - 75) / 25) * 6);
    };

    // Calculate role-specific sub-scores per dimension.
    const roleDef = ROLE_DIMENSIONS[role] || ROLE_DIMENSIONS.partner;
    const subCategoryPlanets = roleDef.planetPairs;

    const subScores = {};
    for (const [dimKey, pairs] of Object.entries(subCategoryPlanets)) {
        let rawScore = 0;
        let maxPossible = 0;
        for (const [pA, pB] of pairs) {
            maxPossible += 4;
            const match = aspectsFound.find(a =>
                (a.planet1 === pA && a.planet2 === pB) ||
                (a.planet1 === pB && a.planet2 === pA)
            );
            if (match) {
                const pts = aspectPoints[match.type] || 0;
                const orbBonus = match.orb <= 2 ? 1.2 : 1;
                rawScore += pts * orbBonus;
            }
        }
        // Base score from this dimension's own pairs, then add match-quality
        // boosts that should lift every dimension (destiny sign / element / density).
        const base = calibrateDim(rawScore, maxPossible);
        const final = Math.min(96, Math.max(50, Math.round(base + matchQualityBoost + densityBoost)));
        subScores[dimKey] = final;
    }

    // V1.2 — TOTAL = AVERAGE OF DIMENSIONS. The user sees the breakdown beneath
    // the score; the top number now mathematically equals their average. No
    // more "98 over a 60" trust-breaking gap.
    const dimValues = Object.values(subScores);
    const harmonyScore = dimValues.length
        ? Math.round(dimValues.reduce((a, b) => a + b, 0) / dimValues.length)
        : 50;

    return {
        harmonyScore,
        scores: subScores,
        links: links.slice(0, 10),
        interAspects: aspectsFound,
        discepoloAnalysis: { scoreValue, category, breakdown, isDestinySign }
    };
};

// Zodiac-sign-only compatibility (sun sign matching)
const SIGN_ORDER = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo', 'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces'];

export const calculateZodiacOnlyScore = (sign1, sign2) => {
    const idx1 = SIGN_ORDER.indexOf(sign1);
    const idx2 = SIGN_ORDER.indexOf(sign2);
    if (idx1 === -1 || idx2 === -1) return { harmonyScore: 50, scores: {}, isZodiacOnly: true, element1: '', element2: '' };

    const elem1 = SIGN_ELEMENTS[sign1] || 'Fire';
    const elem2 = SIGN_ELEMENTS[sign2] || 'Fire';
    const mod1 = SIGN_MODALITIES[sign1] || 'Cardinal';
    const mod2 = SIGN_MODALITIES[sign2] || 'Cardinal';

    let diff = Math.abs(idx1 - idx2);
    if (diff > 6) diff = 12 - diff;

    // Aspect-based base score
    const aspectScores = { 0: 75, 1: 45, 2: 80, 3: 50, 4: 85, 5: 55, 6: 60 };
    let score = aspectScores[diff] || 60;

    // Element harmony bonuses
    if (elem1 === elem2) score += 10; // Same element
    const compatible = { Fire: 'Air', Air: 'Fire', Earth: 'Water', Water: 'Earth' };
    if (compatible[elem1] === elem2) score += 7;

    // Modality bonus
    if (mod1 === mod2) score += 3; // Same modality = shared approach

    // Clamp — generous floor of 48
    score = Math.min(98, Math.max(48, score));

    return {
        harmonyScore: score,
        scores: {
            emotional: Math.min(100, score + (elem1 === 'Water' || elem2 === 'Water' ? 5 : -3)),
            communication: Math.min(100, score + (elem1 === 'Air' || elem2 === 'Air' ? 5 : -3)),
            attraction: Math.min(100, score + (elem1 === 'Fire' || elem2 === 'Fire' ? 5 : -3)),
            stability: Math.min(100, score + (elem1 === 'Earth' || elem2 === 'Earth' ? 5 : -3)),
            growth: Math.min(100, score + (mod1 !== mod2 ? 5 : -2)),
        },
        isZodiacOnly: true,
        element1: elem1,
        element2: elem2,
        links: [],
        interAspects: [],
        discepoloAnalysis: { scoreValue: 0, category: 'Sun Sign', breakdown: [], isDestinySign: mod1 === mod2 }
    };
};
