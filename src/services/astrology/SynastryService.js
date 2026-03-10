import { PlanetName } from '../../types';
import { SIGN_MODALITIES } from '../../constants/AstrologyCore';

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

export const calculateSynastryScore = (chart1, chart2) => {
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

    let uiScore = 0;
    if (scoreValue < 5) uiScore = 30 + (scoreValue / 5) * 20;
    else if (scoreValue < 10) uiScore = 50 + ((scoreValue - 5) / 5) * 20;
    else if (scoreValue < 20) uiScore = 70 + ((scoreValue - 10) / 10) * 20;
    else uiScore = 90 + Math.min(10, ((scoreValue - 20) / 10) * 10);

    return {
        harmonyScore: Math.round(uiScore),
        scores: {
            emotional: Math.min(100, Math.round(uiScore * 1.1)),
            communication: Math.min(100, Math.round(uiScore * 0.9)),
            attraction: Math.min(100, Math.round(uiScore * 1.0)),
            stability: Math.min(100, Math.round(uiScore * 0.95)),
            growth: Math.min(100, Math.round(uiScore * 1.05))
        },
        links: links.slice(0, 10),
        interAspects: aspectsFound,
        discepoloAnalysis: { scoreValue, category, breakdown, isDestinySign }
    };
};
