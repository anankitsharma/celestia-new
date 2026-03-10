
import * as Astronomy from "astronomy-engine";
import { SIGN_ELEMENTS, SIGN_MODALITIES } from '../constants/AstrologyCore';
import { PlanetName, ZodiacSign } from '../types';
import { calculateHouseCusps, getHousePlacement } from './astrology/HouseSystems';
import { normalizeDegrees } from './astrology/math';
import tzLookup from 'tz-lookup';

// --- CONSTANTS ---
const ZODIAC_ORDER = Object.values(ZodiacSign);

const PLANET_IDS = {
    [PlanetName.Sun]: Astronomy.Body.Sun,
    [PlanetName.Moon]: Astronomy.Body.Moon,
    [PlanetName.Mercury]: Astronomy.Body.Mercury,
    [PlanetName.Venus]: Astronomy.Body.Venus,
    [PlanetName.Mars]: Astronomy.Body.Mars,
    [PlanetName.Jupiter]: Astronomy.Body.Jupiter,
    [PlanetName.Saturn]: Astronomy.Body.Saturn,
    [PlanetName.Uranus]: Astronomy.Body.Uranus,
    [PlanetName.Neptune]: Astronomy.Body.Neptune,
    [PlanetName.Pluto]: Astronomy.Body.Pluto,
    [PlanetName.Ascendant]: null,
    [PlanetName.Midheaven]: null,
    [PlanetName.NorthNode]: null,
    [PlanetName.SouthNode]: null,
    [PlanetName.Chiron]: null
};

// Traditional Rulers for Profections (Standard Hellenistic)
const SIGN_RULERS = {
    [ZodiacSign.Aries]: PlanetName.Mars,
    [ZodiacSign.Taurus]: PlanetName.Venus,
    [ZodiacSign.Gemini]: PlanetName.Mercury,
    [ZodiacSign.Cancer]: PlanetName.Moon,
    [ZodiacSign.Leo]: PlanetName.Sun,
    [ZodiacSign.Virgo]: PlanetName.Mercury,
    [ZodiacSign.Libra]: PlanetName.Venus,
    [ZodiacSign.Scorpio]: PlanetName.Mars,
    [ZodiacSign.Sagittarius]: PlanetName.Jupiter,
    [ZodiacSign.Capricorn]: PlanetName.Saturn,
    [ZodiacSign.Aquarius]: PlanetName.Saturn,
    [ZodiacSign.Pisces]: PlanetName.Jupiter
};

// --- 1. GLOBAL SCORING CONSTANTS (STRICT SPEC) ---

const ASPECTS = {
    Conjunction: { angle: 0, maxOrb: 8, base: 5 },
    Sextile: { angle: 60, maxOrb: 6, base: 3 },
    Square: { angle: 90, maxOrb: 7, base: -4 },
    Trine: { angle: 120, maxOrb: 8, base: 4 },
    Opposition: { angle: 180, maxOrb: 8, base: -5 }
};

const PLANET_RELEVANCE = {
    [PlanetName.Sun]: 1.0,
    [PlanetName.Moon]: 1.1,
    [PlanetName.Mercury]: 0.8,
    [PlanetName.Venus]: 1.2,
    [PlanetName.Mars]: 1.0,
    [PlanetName.Jupiter]: 1.1,
    [PlanetName.Saturn]: 1.0,
    // Outer planets defaults
    [PlanetName.Uranus]: 1.0,
    [PlanetName.Neptune]: 1.0,
    [PlanetName.Pluto]: 1.0,
};

export const LIFE_AREAS = {
    Career: { houses: [6, 10], planets: [PlanetName.Sun, PlanetName.Saturn] },
    Love: { houses: [5, 7], planets: [PlanetName.Venus, PlanetName.Moon] },
    Health: { houses: [1, 6], planets: [PlanetName.Sun, PlanetName.Mars] },
    Family: { houses: [4], planets: [PlanetName.Moon] }
};

// --- MATH HELPERS ---



const getSignAndDegree = (longitude) => {
    const idx = Math.floor(longitude / 30);
    const sign = ZODIAC_ORDER[normalizeDegrees(idx) % 12];
    const degree = longitude % 30;
    return { sign, degree };
};

// 2. UTILITY FUNCTIONS

const angularDifference = (deg1, deg2) => {
    let diff = Math.abs(deg1 - deg2);
    if (diff > 180) diff = 360 - diff;
    return diff;
};

const detectAspect = (angle) => {
    for (const [name, config] of Object.entries(ASPECTS)) {
        if (Math.abs(angle - config.angle) <= config.maxOrb) {
            const orb = Math.abs(angle - config.angle);
            return { name, orb, config };
        }
    }
    return null;
};

const orbMultiplier = (orb, maxOrb) => {
    return 1 - (orb / maxOrb);
};

// 3. SINGLE ASPECT CONTRIBUTION
const aspectContribution = (aspectConfig, orb, transitPlanet) => {
    const baseValue = aspectConfig.base;
    const orbFactor = orbMultiplier(orb, aspectConfig.maxOrb);
    const planetWeight = PLANET_RELEVANCE[transitPlanet] || 1.0;

    return baseValue * orbFactor * planetWeight;
};

/**
 * Calculates the UTC Date object for a specific wall-clock time in a target Timezone.
 */
const getTrueBirthDate = (dateStr, timeStr, ianaZone) => {
    try {
        // Ensure inputs exist
        if (!dateStr) throw new Error("Missing date string");

        // CLEANING STEP: Normalize dateStr to YYYY-MM-DD
        // Handle YYYY-MM-DD, DD-MM-YYYY, DD/MM/YYYY, etc. 
        let cleanDate = dateStr.trim();

        // If it contains slashes, replace with dashes
        cleanDate = cleanDate.replace(/\//g, '-');

        // Simple heuristic: if parts[0] is 4 digits, it's YYYY-MM-DD. 
        // If parts[2] is 4 digits, it's likely DD-MM-YYYY or MM-DD-YYYY. 
        // We assume DD-MM-YYYY for non-US centric safety if ambiguous, or standard ISO.
        const parts = cleanDate.split('-');
        if (parts.length === 3) {
            if (parts[2].length === 4) {
                // assume DD-MM-YYYY -> YYYY-MM-DD
                cleanDate = `${parts[2]}-${parts[1]}-${parts[0]}`;
            }
        }

        // Normalize time
        const cleanTime = timeStr ? timeStr.split(':').slice(0, 2).join(':') : "12:00";
        const naiveISO = `${cleanDate}T${cleanTime}:00`;
        const utcRef = new Date(naiveISO + "Z");

        if (isNaN(utcRef.getTime())) {
            console.error(`Invalid Date constructed from: ${naiveISO} (Original: ${dateStr})`);
            return new Date(); // Fallback to NOW to show *something* rather than crash
        }

        try {
            // Attempt Timezone Correction:
            // Goal: Find a UTC timestamp X such that X in 'ianaZone' reads as 'naiveISO' (wall clock).

            // 1. Start with a guess: Treat the input time as UTC.
            const guess = utcRef;

            // 2. Get the components of this guess in the target timezone.
            // usage of 'en-CA' (Canadian) usually gives YYYY-MM-DD format which is easier to parse, 
            // but individual formatting is safest.
            const formatter = new Intl.DateTimeFormat('en-US', {
                timeZone: ianaZone,
                year: 'numeric', month: 'numeric', day: 'numeric',
                hour: 'numeric', minute: 'numeric', second: 'numeric',
                hour12: false
            });

            const tzParts = formatter.formatToParts(guess);
            const getPart = (type) => parseInt(tzParts.find(p => p.type === type)?.value || '0', 10);

            // 3. Construct the "Face Value" date from the timezone-adjusted components
            // We treat these components as if they were UTC to compare apples-to-apples.
            const year = getPart('year');
            const month = getPart('month') - 1; // 0-indexed
            const day = getPart('day');
            const hour = getPart('hour');
            const minute = getPart('minute');
            const second = getPart('second');

            const faceValueUtc = Date.UTC(year, month, day, hour, minute, second);

            // 4. Calculate the offset introduced by the timezone
            // difference = (Guess - FaceValue). 
            // Example: NY (-5). Guess=12:00Z. In NY=07:00. FaceValue=07:00Z.
            // Diff = 12:00 - 07:00 = +5 hours.
            const diff = guess.getTime() - faceValueUtc;

            // 5. Apply the diff to the guess to compensate
            // NewGuess = Guess + Diff = 12:00 + 5h = 17:00Z.
            // Check: 17:00Z in NY is 12:00. Correct.
            return new Date(guess.getTime() + diff);
        } catch (e) {
            console.warn(`Timezone correction failed for ${ianaZone}, falling back to UTC`, e);
            return utcRef;
        }
    } catch (e) {
        console.error("Critical Date Parsing Error", e);
        return new Date();
    }
};

// --- ASTRONOMY CALCULATIONS ---

const getObliquity = (time) => {
    const T = time.tt / 36525.0;
    const epsArcSec = 84381.448 - 46.8150 * T - 0.00059 * T * T + 0.001813 * T * T * T;
    return epsArcSec / 3600.0;
};

const getMeanNorthNode = (time) => {
    const T = time.tt / 36525.0;
    const O = 125.04452 - 1934.136261 * T + 0.0020708 * T * T + (T * T * T) / 450000;
    return normalizeDegrees(O);
};

const calculateAngles = (dateObj, lat, lng) => {
    const astroTime = new Astronomy.AstroTime(dateObj);
    const gmstHours = Astronomy.SiderealTime(dateObj); // Returns hours (0-24)
    const gmstDeg = gmstHours * 15; // Convert to degrees (0-360) (Fix for #30)
    const lstDeg = normalizeDegrees(gmstDeg + lng);
    const epsDeg = getObliquity(astroTime);

    const rad = (deg) => deg * Math.PI / 180;
    const deg = (rad) => rad * 180 / Math.PI;

    const ramc = rad(lstDeg);
    const eps = rad(epsDeg);
    const latRad = rad(lat);

    let mcRad = Math.atan2(Math.sin(ramc), Math.cos(ramc) * Math.cos(eps));
    let mcDeg = normalizeDegrees(deg(mcRad));

    const y = Math.cos(ramc);
    const x = -Math.sin(ramc) * Math.cos(eps) - Math.tan(latRad) * Math.sin(eps);
    let ascRad = Math.atan2(y, x);
    let ascDeg = normalizeDegrees(deg(ascRad));

    return { ascDeg, mcDeg, lstDeg, epsDeg };
};

const getPlanetPosition = (body, time) => {
    const vec = Astronomy.GeoVector(body, time, true);
    return Astronomy.Ecliptic(vec);
};

const isPlanetRetrograde = (body, time) => {
    const pos1 = getPlanetPosition(body, time);
    const later = new Date(time.date.getTime() + 60 * 60 * 1000);
    const time2 = new Astronomy.AstroTime(later);
    const pos2 = getPlanetPosition(body, time2);

    let diff = pos2.elon - pos1.elon;
    if (diff < -180) diff += 360;
    if (diff > 180) diff -= 360;

    return diff < 0;
};

// --- REAL-TIME MOON DATA ---

export const getMoonDataForDate = (date) => {
    const astroTime = new Astronomy.AstroTime(date);
    const moonPhase = Astronomy.MoonPhase(astroTime); // 0 to 360
    const illumination = Astronomy.Illumination(Astronomy.Body.Moon, date).phase_fraction * 100;

    const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true);
    const moonPos = Astronomy.Ecliptic(moonVec);
    const { sign, degree } = getSignAndDegree(moonPos.elon);

    // Calculate Moon Aspects for the day
    // We check Moon vs Sun, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
    const planetsToCheck = [
        { id: Astronomy.Body.Sun, name: 'Sun' },
        { id: Astronomy.Body.Mercury, name: 'Mercury' },
        { id: Astronomy.Body.Venus, name: 'Venus' },
        { id: Astronomy.Body.Mars, name: 'Mars' },
        { id: Astronomy.Body.Jupiter, name: 'Jupiter' },
        { id: Astronomy.Body.Saturn, name: 'Saturn' },
        { id: Astronomy.Body.Uranus, name: 'Uranus' },
        { id: Astronomy.Body.Neptune, name: 'Neptune' },
        { id: Astronomy.Body.Pluto, name: 'Pluto' }
    ];

    let majorAspect = null;
    let minOrb = 10;

    for (const p of planetsToCheck) {
        const pVec = Astronomy.GeoVector(p.id, astroTime, true);
        const pPos = Astronomy.Ecliptic(pVec);

        // Calculate difference
        let diff = Math.abs(moonPos.elon - pPos.elon);
        if (diff > 180) diff = 360 - diff;

        // Check standard aspects
        const aspectList = [
            { name: 'Conjunction', angle: 0, orb: 8 },
            { name: 'Opposition', angle: 180, orb: 8 },
            { name: 'Square', angle: 90, orb: 6 },
            { name: 'Trine', angle: 120, orb: 6 },
            { name: 'Sextile', angle: 60, orb: 4 }
        ];

        for (const asp of aspectList) {
            if (Math.abs(diff - asp.angle) <= asp.orb) {
                const currentOrb = Math.abs(diff - asp.angle);
                // Prefer tighter orbs or major aspects (Conjunction/Opposition/Square)
                // Score can be simplified: hard aspects often define the day's "challenge"
                // For this feature, we prioritize strictness
                if (currentOrb < minOrb) {
                    minOrb = currentOrb;
                    majorAspect = {
                        planet: p.name,
                        aspect: asp.name,
                        label: `Moon ${asp.name} ${p.name}`,
                        orb: currentOrb,
                        type: ['Square', 'Opposition'].includes(asp.name) ? 'Tension' : 'Flow'
                    };
                }
            }
        }
    }

    // Phase Name
    let phaseName = 'New Moon';
    if (moonPhase >= 337.5 || moonPhase < 22.5) phaseName = 'New Moon';
    else if (moonPhase < 67.5) phaseName = 'Waxing Crescent';
    else if (moonPhase < 112.5) phaseName = 'First Quarter';
    else if (moonPhase < 157.5) phaseName = 'Waxing Gibbous';
    else if (moonPhase < 202.5) phaseName = 'Full Moon';
    else if (moonPhase < 247.5) phaseName = 'Waning Gibbous';
    else if (moonPhase < 292.5) phaseName = 'Last Quarter';
    else phaseName = 'Waning Crescent';

    return {
        sign,
        degree: Math.floor(degree),
        minute: Math.floor((degree - Math.floor(degree)) * 60),
        phaseName,
        illumination: Math.round(illumination),
        phaseAngle: moonPhase,
        majorAspect
    };
};

// --- CORE EXPORTS ---

export const calculateChart = (dateStr, time, location, isTimeUnknown = false, houseSystem = 'WholeSign') => {
    try {
        let dateObj;

        if (isTimeUnknown) {
            let tz = location.timezone;
            if (!tz || tz === 'UTC') {
                try {
                    tz = tzLookup(location.lat, location.lng);
                } catch (e) {
                    tz = 'UTC';
                }
            }
            dateObj = getTrueBirthDate(dateStr, "12:00", tz || "UTC");
        } else {
            let tz = location.timezone;
            if (!tz || tz === 'UTC') {
                try {
                    tz = tzLookup(location.lat, location.lng);
                } catch (e) {
                    tz = 'UTC';
                }
            }
            dateObj = getTrueBirthDate(dateStr, time, tz || "UTC");
        }

        if (isNaN(dateObj.getTime())) throw new Error(`Invalid birth date/time`);

        const astroTime = new Astronomy.AstroTime(dateObj);

        // 1. Calculate Angles
        let ascDeg = 0;
        let mcDeg = 0;
        let raMC = 0;
        let obliquity = 23.4367;

        // Recalculate Obliquity always to be safe?
        obliquity = getObliquity(astroTime);

        if (isTimeUnknown) {
            const sunVec = Astronomy.GeoVector(Astronomy.Body.Sun, astroTime, true);
            const sunPos = Astronomy.Ecliptic(sunVec);
            ascDeg = sunPos.elon;
            mcDeg = normalizeDegrees(ascDeg + 90);
            raMC = normalizeDegrees(mcDeg - 90); // Rough approximation
        } else {
            const angles = calculateAngles(dateObj, location.lat, location.lng);
            ascDeg = angles.ascDeg;
            mcDeg = angles.mcDeg;
            raMC = angles.lstDeg;
            obliquity = angles.epsDeg;
        }

        const ascInfo = getSignAndDegree(ascDeg);
        const mcInfo = getSignAndDegree(mcDeg);

        // 2. Calculate Houses (Placidus / Pro Support)
        const cusps = calculateHouseCusps(houseSystem, {
            raMC,
            mc: mcDeg,
            asc: ascDeg,
            lat: location.lat,
            obliquity
        });

        // 3. Calculate Planets
        const planets = [];
        const ascSignIdx = ZODIAC_ORDER.indexOf(ascInfo.sign);

        (Object.keys(PLANET_IDS)).forEach(name => {
            const body = PLANET_IDS[name];
            if (!body) return;

            const ecliptic = getPlanetPosition(body, astroTime);
            const { sign, degree } = getSignAndDegree(ecliptic.elon);
            const isRetro = isPlanetRetrograde(body, astroTime);

            const house = getHousePlacement(ecliptic.elon, cusps);

            planets.push({
                name,
                sign,
                degree,
                absDegree: ecliptic.elon,
                house,
                isRetrograde: isRetro,
                speed: 0
            });
        });

        const nnLong = getMeanNorthNode(astroTime);
        const nnInfo = getSignAndDegree(nnLong);
        const nnHouse = getHousePlacement(nnLong, cusps);

        planets.push({
            name: PlanetName.NorthNode,
            sign: nnInfo.sign,
            degree: nnInfo.degree,
            absDegree: nnLong,
            house: nnHouse,
            isRetrograde: true,
            speed: 0
        });

        // South Node (Always exactly opposite North Node)
        const snLong = normalizeDegrees(nnLong + 180);
        const snInfo = getSignAndDegree(snLong);
        const snHouse = getHousePlacement(snLong, cusps);

        planets.push({
            name: PlanetName.SouthNode,
            sign: snInfo.sign,
            degree: snInfo.degree,
            absDegree: snLong,
            house: snHouse,
            isRetrograde: true,
            speed: 0
        });

        planets.push({
            name: PlanetName.Ascendant,
            sign: ascInfo.sign,
            degree: ascInfo.degree,
            absDegree: ascDeg,
            house: 1,
            isRetrograde: false,
            speed: 0
        });

        const mcHouse = getHousePlacement(mcDeg, cusps);

        planets.push({
            name: PlanetName.Midheaven,
            sign: mcInfo.sign,
            degree: mcInfo.degree,
            absDegree: mcDeg,
            house: mcHouse,
            isRetrograde: false,
            speed: 0
        });

        // 3. Natal Aspects
        const natalAspects = [];
        for (let i = 0; i < planets.length; i++) {
            for (let j = i + 1; j < planets.length; j++) {
                const p1 = planets[i];
                const p2 = planets[j];

                if (p1.name === p2.name) continue;

                const diff = angularDifference(p1.absDegree, p2.absDegree);
                const aspectData = detectAspect(diff);

                if (aspectData) {
                    natalAspects.push({
                        planet1: p1.name,
                        planet2: p2.name,
                        type: aspectData.name,
                        angle: diff,
                        orb: aspectData.orb
                    });
                }
            }
        }

        // 4. House Cusps
        // 4. House Cusps
        const houses = {};
        for (let i = 0; i < 12; i++) {
            const hNum = i + 1;
            const cuspDeg = cusps[i];
            const info = getSignAndDegree(cuspDeg);
            houses[hNum] = { sign: info.sign, degree: info.degree };
        }

        const chartRuler = SIGN_RULERS[ascInfo.sign];

        const WEIGHTS = {
            [PlanetName.Sun]: 3, [PlanetName.Moon]: 3, [PlanetName.Ascendant]: 3,
            [PlanetName.Mercury]: 2, [PlanetName.Venus]: 2, [PlanetName.Mars]: 2,
            [PlanetName.Jupiter]: 1, [PlanetName.Saturn]: 1, [PlanetName.Uranus]: 1,
            [PlanetName.Neptune]: 1, [PlanetName.Pluto]: 1
        };

        const elements = { fire: 0, earth: 0, air: 0, water: 0 };
        const modalities = { cardinal: 0, fixed: 0, mutable: 0 };

        planets.forEach(p => {
            const w = WEIGHTS[p.name] || 0;
            if (w > 0 && p.sign) {
                const el = (SIGN_ELEMENTS[p.sign] || '').toLowerCase();
                const mo = (SIGN_MODALITIES[p.sign] || '').toLowerCase();
                if (el && elements[el] !== undefined) elements[el] += w;
                if (mo && modalities[mo] !== undefined) modalities[mo] += w;
            }
        });

        const sunSign = planets.find(p => p.name === PlanetName.Sun)?.sign;
        const moonSign = planets.find(p => p.name === PlanetName.Moon)?.sign;
        const ascSign = planets.find(p => p.name === PlanetName.Ascendant)?.sign;

        const boostScore = (sign, boostAmount) => {
            if (!sign) return;
            const el = (SIGN_ELEMENTS[sign] || '').toLowerCase();
            const mo = (SIGN_MODALITIES[sign] || '').toLowerCase();
            if (el && elements[el] !== undefined) elements[el] += boostAmount;
            if (mo && modalities[mo] !== undefined) modalities[mo] += boostAmount;
        };

        boostScore(sunSign, 0.3);
        boostScore(moonSign, 0.2);
        boostScore(ascSign, 0.1);

        return {
            planets,
            aspects: natalAspects,
            houses,
            elements,
            modalities,
            chartRuler,
            transits: []
        };

    } catch (e) {
        console.error("Critical Chart Calculation Error", e);
        return {
            planets: [],
            aspects: [],
            houses: {},
            elements: { fire: 0, earth: 0, air: 0, water: 0 },
            modalities: { cardinal: 0, fixed: 0, mutable: 0 },
            chartRuler: PlanetName.Sun
        };
    }
};

// --- SYNASTRY ---


import { SynastryService } from './astrology/SynastryService';

export const calculateSynastry = (chart1, chart2) => {
    try {
        return SynastryService.calculateSynastryScore(chart1, chart2);
    } catch (e) {
        console.error("Synastry Calc Error:", e);
        // Fallback to legacy empty state if service fails
        return {
            harmonyScore: 60,
            scores: { emotional: 60, communication: 60, attraction: 60, stability: 60, growth: 60 },
            links: [],
            interAspects: []
        };
    }
};

// --- REAL-TIME VITAL CALCULATOR (RESEARCH-BASED) ---

// 4. RAW INFLUENCE CALCULATION (CORE ENGINE)
const calculateRawInfluence = (lifeAreaKey, natal, transits, activeTransitPlanets) => {
    let rawScore = 0;
        const config = LIFE_AREAS[lifeAreaKey];
    if (!config) return 0;

    config.planets.forEach((natalPlanetName) => {
        const natalP = natal.planets.find(p => p.name === natalPlanetName);
        if (!natalP) return;

        transits.forEach(transitP => {
            if (!activeTransitPlanets.includes(transitP.name)) return;

            const angle = angularDifference(natalP.absDegree, transitP.absDegree);
            const aspectInfo = detectAspect(angle);

            if (aspectInfo) {
                rawScore += aspectContribution(aspectInfo.config, aspectInfo.orb, transitP.name);
            }
        });
    });
    return rawScore;
};

// 5. NORMALIZATION FUNCTION (Optimism-Forward)
const normalize = (rawScore, minScore, maxScore) => {
    // Clamp raw score to observed bounds
    const clampedRaw = Math.max(minScore, Math.min(maxScore, rawScore));

    // Shift raw score into 0–1 range
    const x = (clampedRaw - minScore) / (maxScore - minScore);

    // Apply optimism curve
    // User Request: Average/Neutral ~70%. High 90-100%.
    // Current Curve: x^0.4
    // If x (Neutral) is ~0.41 of the range, output is 0.70 (70%).
    const optimismCurve = Math.pow(x, 0.4);

    // Convert to percentage
    return Math.max(0, Math.min(100, Math.round(optimismCurve * 100)));
};

const getProfectedHouse = (age) => (age % 12) + 1;

// Calculate Transits Helper
const getTransitPositions = (date) => {
    const time = new Astronomy.AstroTime(date);
    const transits = [];
    (Object.keys(PLANET_IDS)).forEach(name => {
        const body = PLANET_IDS[name];
        if (!body) return;
        const vec = Astronomy.GeoVector(body, time, true);
        const ecl = Astronomy.Ecliptic(vec);
        const { sign } = getSignAndDegree(ecl.elon);
        transits.push({ name, absDegree: ecl.elon, sign, degree: 0, house: 0, isRetrograde: false, speed: 0 });
    });
    return transits;
};

// --- MAIN COSMIC ENERGY FUNCTION ---

export const calculateCosmicEnergy = (natal, date = new Date(), timeframe = 'today', birthDate) => {
    const results = [];
    const areaKeys = Object.keys(LIFE_AREAS);

    // 6. DAILY SCORE (MOON-DRIVEN)
    if (['today', 'yesterday', 'tomorrow'].includes(timeframe)) {
        const transits = getTransitPositions(date);
        const drivers = [PlanetName.Moon, PlanetName.Sun, PlanetName.Venus];

        areaKeys.forEach(area => {
            const raw = calculateRawInfluence(area, natal, transits, drivers);
            // Adjusted Bounds for 70% Neutral:
            // Neutral (0) needs to be ~41% into the range.
            // Range -14 to 20 = 34. 14/34 = 0.41. 0.41^0.4 = 0.70.
            const score = normalize(raw, -14, 20);
            results.push({ id: area, value: score, label: area, color: getAreaColor(area) });
        });
    }
    // 7. WEEKLY SCORE (SUN / VENUS / MERCURY)
    else if (timeframe === 'weekly') {
        const dailyRawScores = { Career: [], Love: [], Health: [], Family: [] };
        const drivers = [PlanetName.Sun, PlanetName.Venus, PlanetName.Mercury];

        // Iterate 7 days
        for (let i = 0; i < 7; i++) {
            const d = new Date(date);
            d.setDate(d.getDate() + i);
            const t = getTransitPositions(d);
            areaKeys.forEach(area => {
                const r = calculateRawInfluence(area, natal, t, drivers);
                dailyRawScores[area].push(r);
            });
        }

        areaKeys.forEach(area => {
            const sum = dailyRawScores[area].reduce((a, b) => a + b, 0);
            const avg = sum / 7;
            // Adjusted Bounds for 70% Neutral:
            // Neutral (0) needs to be ~41% into the range.
            // Range -15 to 22 = 37. 15/37 = 0.405 -> ~70%
            const score = normalize(avg, -15, 22);
            results.push({ id: area, value: score, label: area, color: getAreaColor(area) });
        });
    }
    // 8. MONTHLY SCORE (MARS / JUPITER)
    else if (timeframe === 'monthly') {
        const dailyRawScores = { Career: [], Love: [], Health: [], Family: [] };
        const drivers = [PlanetName.Mars, PlanetName.Jupiter];

        // NEW: Multi-Point Sampling for Accuracy (Mars moves significantly in 30 days)
        // Check Day 1, 10, 20, 28
        const checkpoints = [0, 10, 20, 28];

        checkpoints.forEach(offset => {
            const d = new Date(date);
            d.setDate(d.getDate() + offset);
            const t = getTransitPositions(d);
            areaKeys.forEach(area => {
                const r = calculateRawInfluence(area, natal, t, drivers);
                dailyRawScores[area].push(r);
            });
        });

        areaKeys.forEach(area => {
            const sum = dailyRawScores[area].reduce((a, b) => a + b, 0);
            const avg = sum / checkpoints.length;

            // Adjusted Bounds for 70% Neutral:
            // Neutral (0) needs to be ~41% into range.
            // Range -18 to 26 = 44. 18/44 = 0.409 -> ~70%
            const score = normalize(avg, -18, 26);
            results.push({ id: area, value: score, label: area, color: getAreaColor(area) });
        });
    }
    // 9. YEARLY SCORE (SATURN / JUPITER + PROFECTIONS)
    else if (timeframe === 'yearly') {
        const transits = getTransitPositions(date);
        const drivers = [PlanetName.Saturn, PlanetName.Jupiter];

        let age = 0;
        if (birthDate) {
            const birth = new Date(birthDate);
            age = date.getFullYear() - birth.getFullYear();
            if (date < new Date(date.getFullYear(), birth.getMonth(), birth.getDate())) {
                age--;
            }
            if (age < 0) age = 0;
        }
        const profectedHouse = getProfectedHouse(age);

        areaKeys.forEach(area => {
            let raw = calculateRawInfluence(area, natal, transits, drivers);
                        if (LIFE_AREAS[area].houses.includes(profectedHouse)) {
                raw = raw * 1.35; // Profection multiplier
            }
            // Range shifted: -25 low allows 0 (neutral) to sit at ~68%
            // Adjusted Bounds for 70% Neutral:
            // Neutral (0) needs to be ~41% into range.
            // Range -25 to 36 = 61. 25/61 = 0.409 -> ~70%
            const score = normalize(raw, -25, 36);
            results.push({ id: area, value: score, label: area, color: getAreaColor(area) });
        });
    } else {
        // Fallback to daily
        const transits = getTransitPositions(date);
        const drivers = [PlanetName.Moon, PlanetName.Sun, PlanetName.Venus];
        areaKeys.forEach(area => {
            const raw = calculateRawInfluence(area, natal, transits, drivers);
            // Daily bounds
            const score = normalize(raw, -12, 20);
            results.push({ id: area, value: score, label: area, color: getAreaColor(area) });
        });
    }

    return results;
};

const getAreaColor = (area) => {
    switch (area) {
        case 'Career': return '#525252';
        case 'Love': return '#E11D48';
        case 'Health': return '#059669';
        case 'Family': return '#7C3AED';
        default: return '#000000';
    }
};

// --- 7. ROBUST TRANSIT ENGINE (Fixed) ---

// Helper: Get Transit Summary for Gemini
export const getTransitSummary = (natal, date = new Date(), period = 'today') => {
    // 1. Calculate Active Transits
    const transits = getTransitPositions(date);
    const impacts = [];

    // Drivers depend on period
    // Daily: Moon, Sun, Mercury, Venus, Mars
    // We want fast moving planets for "vibes"
    const fastMovers = [PlanetName.Moon, PlanetName.Sun, PlanetName.Mercury, PlanetName.Venus, PlanetName.Mars];
    const heavyHitters = [PlanetName.Jupiter, PlanetName.Saturn, PlanetName.Uranus, PlanetName.Neptune, PlanetName.Pluto];

    // Check Transits vs Natal
    transits.forEach(tp => {
        // Skip slow-moving vs slow-moving for daily insights (generational)
        // mainly focus on:
        // 1. Fast Mover hitting ANY Natal Planet (Personal Trigger)
        // 2. Heavy Hitter hitting Personal Natal Planet (Life Lesson)

        const isFast = fastMovers.includes(tp.name);

        natal.planets.forEach(np => {
            // Skip slow vs slow (e.g. Transit Pluto vs Natal Neptune) - meaningless for daily
            if (!isFast && !['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Ascendant'].includes(np.name)) return;

            const diff = angularDifference(tp.absDegree, np.absDegree);
            const aspect = detectAspect(diff);

            if (aspect) {
                // Format: "Transit Mars Square Natal Sun"
                impacts.push(`Transit ${tp.name} ${aspect.name} Natal ${np.name} (Orb ${aspect.orb.toFixed(1)})`);
            }
        });
    });

    // Also add Moon Phase Context
    const moon = getMoonDataForDate(date);
    impacts.unshift(`Moon Phase: ${moon.phaseName} in ${moon.sign}`);

    return impacts.join(". ");
};

// --- WEEKLY SCANNER (The Rolling Timeline) ---
export const getWeeklyTransitScan = (natal, startDate) => {
    const timeline = [];
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

    // We track previous positions to detect changes (Ingresses)
    let prevTransits = getTransitPositions(startDate); // Start state

    // Loop 7 days
    for (let i = 0; i < 7; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dayName = days[currentDate.getDay()];

        // Calculate Noon positions for this day
        currentDate.setHours(12, 0, 0, 0);
        const currentTransits = getTransitPositions(currentDate);

        const dayEvents = [];

        // 1. Detect Ingresses (Sign Change from Prev Day)
        if (i > 0) { // Skip day 0 ingress check, or check vs yesterday
            currentTransits.forEach(curr => {
                // Skip fast Moon ingresses for weekly summary (too much noise), focus on Sun/Merc/Venus/Mars+
                if (curr.name === 'Moon') return;

                const prev = prevTransits.find(p => p.name === curr.name);
                if (prev && prev.sign !== curr.sign) {
                    dayEvents.push(`${curr.name} enters ${curr.sign}`);
                }
            });
        }

        // 2. Detect Exact Aspects (Transit vs Natal)
        // For weekly, we want EXACT hits (orb < 1.0) to flag "The Day It Happens"
        currentTransits.forEach(tp => {
            // Skip Moon for weekly aspects (too fleeting)
            if (tp.name === 'Moon') return;

            natal.planets.forEach(np => {
                const diff = angularDifference(tp.absDegree, np.absDegree);
                const aspect = detectAspect(diff);

                // Strict Orb for Weekly timing: 1.5 degrees
                if (aspect && aspect.orb < 1.5) {
                    // Check if it's a major aspect
                    if (['Conjunction', 'Opposition', 'Square', 'Trine'].includes(aspect.name)) {
                        dayEvents.push(`${tp.name} ${aspect.name} Natal ${np.name}`);
                    }
                }
            });
        });

        // 3. Add to Timeline if events exist
        if (dayEvents.length > 0) {
            // Deduplicate
            const uniqueEvents = Array.from(new Set(dayEvents));
            timeline.push(`${dayName}: ${uniqueEvents.join(", ")}.`);
        }

        // Update prev for next loop
        prevTransits = currentTransits;
    }

    if (timeline.length === 0) return "No major planetary shifts this week. Focus on routine.";

    return timeline.join("\n");
};

// --- MONTHLY SCANNER (The Structural Forces) ---
const getHouseCusps = (houses) => {
    const cusps = [];
    const signs = Object.values(ZodiacSign);
    for (let i = 1; i <= 12; i++) {
                const h = houses[i] || houses[i.toString()];
        if (h) {
            const signIdx = signs.indexOf(h.sign);
            cusps.push(signIdx * 30 + h.degree);
        } else {
            cusps.push((i - 1) * 30);
        }
    }
    return cusps;
};



export const getMonthlyTransitScan = (natal, startDate) => {
    const timeline = [];
    let prevTransits = getTransitPositions(startDate);
    const houseCusps = natal.houses ? getHouseCusps(natal.houses) : [];

    // Track Last Moon Phase to detect changes
    let lastPhaseName = getMoonDataForDate(startDate).phaseName;

    // Loop 30 days
    for (let i = 0; i < 30; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);
        const dateStr = currentDate.getDate(); // e.g. "12th"

        currentDate.setHours(12, 0, 0, 0);
        const currentTransits = getTransitPositions(currentDate);
        const moonData = getMoonDataForDate(currentDate);

        const dayEvents = [];

        // 1. Lunations (New/Full Moon)
        // We detect the switch into the phase name for accuracy
        if (moonData.phaseName !== lastPhaseName) {
            if (moonData.phaseName === 'New Moon') {
                const moonTransit = currentTransits.find(t => t.name === 'Moon');
                // Use houseCusps (array) instead of natal.houses (object)
                const houseNum = (houseCusps.length > 0 && moonTransit) ? getHousePlacement(moonTransit.absDegree, houseCusps) : '?';
                dayEvents.push(`🌑 New Moon in ${moonData.sign} (House ${houseNum}) - Set intentions.`);

            } else if (moonData.phaseName === 'Full Moon') {
                const moonTransit = currentTransits.find(t => t.name === 'Moon');
                const houseNum = (houseCusps.length > 0 && moonTransit) ? getHousePlacement(moonTransit.absDegree, houseCusps) : '?';
                dayEvents.push(`🌕 Full Moon in ${moonData.sign} (House ${houseNum}) - Release and integrate.`);
            }
        }
        lastPhaseName = moonData.phaseName;

        // 2. Ingresses (Sign Changes) - Sun, Mercury, Venus, Mars
        if (i > 0) {
            currentTransits.forEach(curr => {
                if (['Moon', 'NorthNode', 'Lilith'].includes(curr.name)) return; // Skip fast/minor
                const prev = prevTransits.find(p => p.name === curr.name);
                if (prev && prev.sign !== curr.sign) {
                    dayEvents.push(`➝ ${curr.name} enters ${curr.sign}`);
                }
            });
        }

        // 3. Heavy Hitters (Outer Planet Aspects)
        // Jupiter, Saturn, Uranus, Neptune, Pluto vs Natal Planets
        currentTransits.forEach(tp => {
            if (!['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'].includes(tp.name)) return;

            natal.planets.forEach(np => {
                const diff = angularDifference(tp.absDegree, np.absDegree);
                const aspect = detectAspect(diff);

                // Tight Orb for Monthly "Peak Days"
                if (aspect && aspect.orb < 1.0) {
                    // Only major aspects
                    if (['Conjunction', 'Opposition', 'Square', 'Trine'].includes(aspect.name)) {
                        dayEvents.push(`⚡ ${tp.name} ${aspect.name} Natal ${np.name}`);
                    }
                }
            });
        });

        if (dayEvents.length > 0) {
            const uniqueEvents = Array.from(new Set(dayEvents));
            timeline.push(`Day ${dateStr}: ${uniqueEvents.join(", ")}`);
        }

        prevTransits = currentTransits;
    }

    if (timeline.length === 0) return "A month of steady integration. No major outer planetary storms.";
    return timeline.join("\n");
};

// --- YEARLY SCANNER (The Macro View) ---
// --- YEARLY STRUCTURED DATA (V2) ---
export const getYearlyForecastData = (natal, startYearDate) => {
    // 1. Profection
    let age = 0;
        if (natal.birthDate) {
                const birth = new Date(natal.birthDate);
        age = startYearDate.getFullYear() - birth.getFullYear();
        // Adjust roughly for birthday passed
        const currentBirthday = new Date(startYearDate.getFullYear(), birth.getMonth(), birth.getDate());
        if (startYearDate < currentBirthday) age--;
        if (age < 0) age = 0;
    }
    const profectedHouse = (age % 12) + 1;

    // Map House to Ruler (Standard Hellenistic)
    const signRulers = {
        1: PlanetName.Mars, 2: PlanetName.Venus, 3: PlanetName.Mercury, 4: PlanetName.Moon,
        5: PlanetName.Sun, 6: PlanetName.Mercury, 7: PlanetName.Venus, 8: PlanetName.Mars,
        9: PlanetName.Jupiter, 10: PlanetName.Saturn, 11: PlanetName.Saturn, 12: PlanetName.Jupiter
    };

    // Find Sign of Profected House Cusp
    const houseCusps = natal.houses ? getHouseCusps(natal.houses) : [];
    const profectedHouseIdx = profectedHouse - 1;
    let ruler = signRulers[profectedHouse]; // Fallback natural

    if (houseCusps.length === 12) {
        const cuspDeg = houseCusps[profectedHouseIdx];
        const signIdx = Math.floor(cuspDeg / 30);
        const signs = Object.values(ZodiacSign);
        const sign = signs[signIdx];

        const signRulerMap = {
            [ZodiacSign.Aries]: PlanetName.Mars, [ZodiacSign.Taurus]: PlanetName.Venus,
            [ZodiacSign.Gemini]: PlanetName.Mercury, [ZodiacSign.Cancer]: PlanetName.Moon,
            [ZodiacSign.Leo]: PlanetName.Sun, [ZodiacSign.Virgo]: PlanetName.Mercury,
            [ZodiacSign.Libra]: PlanetName.Venus, [ZodiacSign.Scorpio]: PlanetName.Mars,
            [ZodiacSign.Sagittarius]: PlanetName.Jupiter, [ZodiacSign.Capricorn]: PlanetName.Saturn,
            [ZodiacSign.Aquarius]: PlanetName.Saturn, [ZodiacSign.Pisces]: PlanetName.Jupiter
        };
        ruler = signRulerMap[sign];
    }

    const contextThemes = {
        1: "Self & Identity", 2: "Wealth & Values", 3: "Communication", 4: "Home & Roots",
        5: "Creativity & Joy", 6: "Health & Routine", 7: "Partnership", 8: "Transformation",
        9: "Travel & Wisdom", 10: "Career & Public", 11: "Community & Hopes", 12: "Solitude & Spirit"
    };

    // 2. Giants (Current State)
    const currentTransits = getTransitPositions(startYearDate);
    const jup = currentTransits.find(t => t.name === 'Jupiter');
    const sat = currentTransits.find(t => t.name === 'Saturn');
    const node = currentTransits.find(t => t.name === 'North Node');

    // Calc Houses
    const jupHouse = houseCusps.length > 0 ? getHousePlacement(jup.absDegree, houseCusps) : 0;
    const satHouse = houseCusps.length > 0 ? getHousePlacement(sat.absDegree, houseCusps) : 0;

    let nodesData;
    if (node) {
        const nnHouse = houseCusps.length > 0 ? getHousePlacement(node.absDegree, houseCusps) : 0;
        // South Node is exactly opposite
        let snDegree = (node.absDegree + 180) % 360;
        const snHouse = houseCusps.length > 0 ? getHousePlacement(snDegree, houseCusps) : 0;

        // South Node Sign
        const snSignIdx = Math.floor(snDegree / 30);
        const snSign = Object.values(ZodiacSign)[snSignIdx]; // Use defined const if available
        // Recalc Sign for clearer safety
        const snSignName = ZODIAC_ORDER[Math.floor(snDegree / 30)];

        nodesData = {
            axis: `${node.sign} / ${snSignName}`,
            houses: [nnHouse, snHouse]
        };
    }


    // 3. Timeline & Retrograde Scan
    const timeline = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    let prevGiants = currentTransits.filter(p => ['Jupiter', 'Saturn'].includes(p.name));

    let venusRetro = { isRetro: false, dates: '' };
    let marsRetro = { isRetro: false, dates: '' };

    for (let i = 0; i < 12; i++) {
        const d = new Date(startYearDate);
        d.setMonth(startYearDate.getMonth() + i);
        d.setDate(15);

        const currTransits = getTransitPositions(d);
        const currGiants = currTransits.filter(p => ['Jupiter', 'Saturn'].includes(p.name));

        // Scan Retrogrades
        const ven = currTransits.find(t => t.name === 'Venus');
        const mar = currTransits.find(t => t.name === 'Mars');

        if (ven?.isRetrograde && !venusRetro.isRetro) {
            venusRetro = { isRetro: true, dates: `Around ${months[d.getMonth()]}` };
        }
        if (mar?.isRetrograde && !marsRetro.isRetro) {
            marsRetro = { isRetro: true, dates: `Around ${months[d.getMonth()]}` };
        }

        currGiants.forEach(cur => {
            const prev = prevGiants.find(p => p.name === cur.name);
            if (prev && prev.sign !== cur.sign) {
                const houseNum = houseCusps.length > 0 ? getHousePlacement(cur.absDegree, houseCusps) : '?';
                timeline.push({
                    date: `${months[d.getMonth()]} ${d.getFullYear()}`,
                    event: `${cur.name} enters ${cur.sign} (House ${houseNum})`
                });
            }
        });
        prevGiants = currGiants;
    }

    return {
        profection: {
            house: profectedHouse,
            ruler: ruler,
            theme: contextThemes[profectedHouse]
        },

        jupiter: { sign: jup.sign, house: jupHouse, retrograde: jup.isRetrograde },
        saturn: { sign: sat.sign, house: satHouse, retrograde: sat.isRetrograde },
        nodes: nodesData,
        love: {
            venusRetro,
            jupiterInLoveHouse: [5, 7].includes(jupHouse)
        },
        career: {
            marsRetro,
            saturnInCareerHouse: [2, 6, 10].includes(satHouse)
        },
        timeline
    };
};

// --- LOVE FORECAST ENGINE V2 ---

/**
 * Calculates a 0-100 "Love Score" for a specific date based on:
 * 1. Moon Position (5th/7th House Activation)
 * 2. Venus/Mars Transits to Natal Planets
 */
export const calculateDailyLoveScore = (natal, targetDate) => {
    let score = 50; // Base score
    const reasons = [];
    const astroTime = new Astronomy.AstroTime(targetDate);

    // 1. Moon Check (Emotional Pulse)
    const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true);
    const moonPos = Astronomy.Ecliptic(moonVec);
    // const { degree: moonDegree } = getSignAndDegree(moonPos.elon); // Unused

    // Find House of Moon
    if (natal.houses) {
        const moonHouse = getHousePlacement(moonPos.elon, getHouseCusps(natal.houses));
        if (moonHouse === 5) {
            score += 20;
            reasons.push("Moon in 5th House (Romance Sector)");
        } else if (moonHouse === 7) {
            score += 25;
            reasons.push("Moon in 7th House (Partnership Sector)");
        }
    }

    // 2. Venus Aspects (The Lover)
    const venusVec = Astronomy.GeoVector(Astronomy.Body.Venus, astroTime, true);
    const venusPos = Astronomy.Ecliptic(venusVec);

    natal.planets.forEach(np => {
        if (['Sun', 'Moon', 'Venus', 'Mars', 'Ascendant'].includes(np.name)) {
            const diff = angularDifference(venusPos.elon, np.absDegree);
            const aspect = detectAspect(diff);

            if (aspect && aspect.orb < 2) { // Tight orb for daily trigger
                if (['Conjunction', 'Trine', 'Sextile'].includes(aspect.name)) {
                    score += 15;
                    reasons.push(`Venus ${aspect.name} Natal ${np.name}`);
                } else if (['Square', 'Opposition'].includes(aspect.name)) {
                    score -= 5; // Tension/Passion
                    reasons.push(`Venus ${aspect.name} Natal ${np.name} (Tension)`);
                }
            }
        }
    });

    // 3. Mars Aspects (The Pursuer)
    const marsVec = Astronomy.GeoVector(Astronomy.Body.Mars, astroTime, true);
    const marsPos = Astronomy.Ecliptic(marsVec);

    natal.planets.forEach(np => {
        if (['Venus', 'Mars'].includes(np.name)) {
            const diff = angularDifference(marsPos.elon, np.absDegree);
            const aspect = detectAspect(diff);
            if (aspect && ['Conjunction', 'Opposition'].includes(aspect.name) && aspect.orb < 2) {
                score += 10;
                reasons.push(`Mars ${aspect.name} Natal ${np.name} (Passion)`);
            }
        }
    });

    return {
        score: Math.min(100, Math.max(0, score)),
        reasons
    };
};

/**
 * Scans the week for Love Peaks and Ingresses.
 */
export const getLoveTimeline = (natal, startDate) => {
    const timeline = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
        const d = new Date(startDate);
        d.setDate(startDate.getDate() + i);
        const { score, reasons } = calculateDailyLoveScore(natal, d);

        // Threshold for "Event"
        if (score >= 70 || reasons.length > 0) {
            timeline.push({
                date: days[d.getDay()],
                event: reasons[0] || "Romantic Potential",
                score
            });
        }
    }
    return timeline.sort((a, b) => b.score - a.score).slice(0, 3); // Return top 3 moments
};

/**
 * Scans the month for Lunations in Love Houses.
 */
export const getLoveSeason = (natal, monthDate) => {
    return {
        focus: "Building Connection",
        events: []
    };
};

export const calculateForecast = (natal, period) => {
    const targetDate = new Date();

    // Handle Time-Based Offsets
    if (period === 'yesterday') {
        targetDate.setDate(targetDate.getDate() - 1);
    } else if (period === 'tomorrow') {
        targetDate.setDate(targetDate.getDate() + 1);
    }

    const astroTime = new Astronomy.AstroTime(targetDate);
    const impacts = [];

    // Get positions
    const transits = [];
    (Object.keys(PLANET_IDS)).forEach(name => {
        const body = PLANET_IDS[name];
        if (!body) return;
        const ecliptic = getPlanetPosition(body, astroTime);
        transits.push({ name, absDegree: ecliptic.elon });
    });

    // ROBUST CHECK (Major Aspects Only)
    transits.forEach(tp => {
        natal.planets.forEach(np => {
            const diff = angularDifference(tp.absDegree, np.absDegree);
            const aspect = detectAspect(diff); // Uses standard orbs defined at top

            if (aspect) {
                const isMajor = ['Conjunction', 'Opposition', 'Square', 'Trine'].includes(aspect.name);
                if (!isMajor) return;

                // Priority Filtering for "Impacts" List
                // We only want the BIGGEST hits for said period

                // 1. Moon Hits (Daily Mood)
                if ((period === 'today' || period === 'yesterday' || period === 'tomorrow') && tp.name === 'Moon') {
                    // Only show Conjunctions/Oppositions for Moon to avoid noise
                    if (['Conjunction', 'Opposition'].includes(aspect.name)) {
                        impacts.push({
                            label: 'Emotional Tide',
                            impact: `The Moon is in ${aspect.name} to your ${np.name}.`
                        });
                    }
                }

                // 2. Heavy Hitter Activations (The "Weather")
                if (['Saturn', 'Jupiter', 'Mars'].includes(tp.name)) {
                    // Mars = Action, Jupiter = Luck, Saturn = Challenge
                    impacts.push({
                        label: `${tp.name} Transit`,
                        impact: `${tp.name} is forming a ${aspect.name} to your natal ${np.name}.`
                    });
                }
            }
        });
    });

    // Deduplicate by label (simple fix)
    const uniqueImpacts = impacts.filter((v, i, a) => a.findIndex(t => (t.label === v.label)) === i).slice(0, 3);

    return {
        intensity: 75,
        period,
        dateLabel: targetDate.toLocaleDateString(),
        focus: uniqueImpacts[0]?.label || "Integration",
        summary: uniqueImpacts[0]?.impact || "The skies are relatively quiet for your chart right now.",
        aspects: uniqueImpacts
    };
};

// Get current sky positions for all major planets (for display)
export const getTransitPlanets = (date = new Date()) => {
    const astroTime = new Astronomy.AstroTime(date);
    const planets = [
        { name: 'Sun', body: Astronomy.Body.Sun },
        { name: 'Moon', body: Astronomy.Body.Moon },
        { name: 'Mercury', body: Astronomy.Body.Mercury },
        { name: 'Venus', body: Astronomy.Body.Venus },
        { name: 'Mars', body: Astronomy.Body.Mars },
        { name: 'Jupiter', body: Astronomy.Body.Jupiter },
        { name: 'Saturn', body: Astronomy.Body.Saturn },
        { name: 'Uranus', body: Astronomy.Body.Uranus },
        { name: 'Neptune', body: Astronomy.Body.Neptune },
        { name: 'Pluto', body: Astronomy.Body.Pluto },
    ];

    return planets.map(({ name, body }) => {
        try {
            const vec = Astronomy.GeoVector(body, astroTime, true);
            const ecl = Astronomy.Ecliptic(vec);
            const { sign, degree } = getSignAndDegree(ecl.elon);
            // Sun and Moon cannot be retrograde
            const canRetrograde = name !== 'Sun' && name !== 'Moon';
            const isRetrograde = canRetrograde ? isPlanetRetrograde(body, astroTime) : false;
            return { name, sign, degree, absDegree: ecl.elon, isRetrograde };
        } catch (e) {
            return { name, sign: '—', degree: 0, absDegree: 0, isRetrograde: false };
        }
    });
};

export const getCurrentMoonData = () => {
    const now = new Date();
    const astroTime = new Astronomy.AstroTime(now);
    const moonPhase = Astronomy.MoonPhase(astroTime);

    const moonVec = Astronomy.GeoVector(Astronomy.Body.Moon, astroTime, true);
    const moonPos = Astronomy.Ecliptic(moonVec);
    const { sign } = getSignAndDegree(moonPos.elon);

    let phaseName = 'New Moon';
    if (moonPhase >= 337.5 || moonPhase < 22.5) phaseName = 'New Moon';
    else if (moonPhase < 67.5) phaseName = 'Waxing Crescent';
    else if (moonPhase < 112.5) phaseName = 'First Quarter';
    else if (moonPhase < 157.5) phaseName = 'Waxing Gibbous';
    else if (moonPhase < 202.5) phaseName = 'Full Moon';
    else if (moonPhase < 247.5) phaseName = 'Waning Gibbous';
    else if (moonPhase < 292.5) phaseName = 'Last Quarter';
    else phaseName = 'Waning Crescent';

    return {
        phaseDegrees: moonPhase,
        phaseName,
        sign
    };
};

// ── COSMIC WINDOWS: Detect active transits to user's natal chart ──

export const getActiveCosmicWindows = (natalChart, date = new Date()) => {
    if (!natalChart?.planets) return [];
    const transits = getTransitPlanets(date);
    const windows = [];

    // Check if any slow-moving transit planet is in a natal sign
    const slowPlanets = ['Jupiter', 'Saturn', 'Uranus', 'Neptune', 'Pluto'];
    const natalSun = natalChart.planets.find(p => p.name === 'Sun');
    const natalMoon = natalChart.planets.find(p => p.name === 'Moon');
    const natalRising = natalChart.planets.find(p => p.name === 'Ascendant');

    for (const tp of transits) {
        if (!slowPlanets.includes(tp.name)) continue;

        if (natalSun && tp.sign === natalSun.sign) {
            windows.push({
                planet: tp.name,
                type: 'sign_transit',
                targetSign: natalSun.sign,
                description: `${tp.name} is in your Sun sign (${natalSun.sign})`,
                significance: 'high',
            });
        }
        if (natalRising && tp.sign === natalRising.sign) {
            windows.push({
                planet: tp.name,
                type: 'sign_transit',
                targetSign: natalRising.sign,
                description: `${tp.name} is transiting your Rising sign (${natalRising.sign})`,
                significance: 'high',
            });
        }
    }

    // Check for exact transits (orb < 2°) to natal planets
    const natalPlanets = natalChart.planets.filter(p =>
        ['Sun', 'Moon', 'Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'].includes(p.name)
    );

    for (const tp of transits) {
        if (tp.name === 'Moon') continue; // Moon moves too fast
        for (const np of natalPlanets) {
            if (tp.name === np.name) continue; // Skip same planet
            const diff = Math.abs(tp.absDegree - np.absDegree);
            const orb = Math.min(diff, 360 - diff);
            // Check major aspects within tight orb
            const aspects = [
                { name: 'Conjunction', angle: 0, maxOrb: 2 },
                { name: 'Opposition', angle: 180, maxOrb: 2 },
                { name: 'Square', angle: 90, maxOrb: 1.5 },
                { name: 'Trine', angle: 120, maxOrb: 1.5 },
            ];
            for (const asp of aspects) {
                const aspOrb = Math.abs(orb - asp.angle);
                if (aspOrb <= asp.maxOrb) {
                    windows.push({
                        planet: tp.name,
                        type: 'exact_aspect',
                        aspect: asp.name,
                        natalPlanet: np.name,
                        orb: aspOrb.toFixed(1),
                        description: `${tp.name} ${asp.name.toLowerCase()} your natal ${np.name}`,
                        significance: aspOrb <= 1 ? 'exact' : 'tight',
                    });
                }
            }
        }
    }

    return windows;
};

export const isMercuryRetrograde = (date = new Date()) => {
    const transits = getTransitPlanets(date);
    const mercury = transits.find(p => p.name === 'Mercury');
    return mercury?.isRetrograde || false;
};
