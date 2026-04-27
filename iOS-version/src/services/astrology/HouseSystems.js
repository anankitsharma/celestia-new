import {
    arccot,
    degreesToRadians,
    radiansToDegrees,
    sinFromDegrees,
    cosFromDegrees,
    tanFromDegrees,
    modulo
} from './math';

const shouldMod180 = (prevCusp, currentCusp) => {
    if (currentCusp < prevCusp) {
        if (Math.abs(currentCusp - prevCusp) >= 180) return false;
        return true;
    }
    if (prevCusp < currentCusp) {
        if (currentCusp - prevCusp < 180) return false;
        return true;
    }
    return false;
};

const calculateCusps1 = (ascendant, midheaven, calculatedCuspFunction) => {
    const c1 = ascendant;
    const c2 = modulo(calculatedCuspFunction(2), 360);
    const c3 = modulo(calculatedCuspFunction(3), 360);
    const c4 = modulo(midheaven + 180, 360);
    const c10 = midheaven;
    const c11 = calculatedCuspFunction(11);
    const c12 = calculatedCuspFunction(12);

    const c5 = modulo(c11 + 180, 360);
    const c6 = modulo(c12 + 180, 360);
    const c7 = modulo(ascendant + 180, 360);
    const c8 = modulo(c2 + 180, 360);
    const c9 = modulo(c3 + 180, 360);

    const firstCusp = c1;
    const secondCusp = shouldMod180(c1, c2) ? modulo(c2 + 180, 360) : c2;
    const thirdCusp = shouldMod180(c1, c3) ? modulo(c3 + 180, 360) : c3;
    const fourthCusp = c4;
    const fifthCusp = shouldMod180(c4, c5) ? modulo(c5 + 180, 360) : c5;
    const sixthCusp = shouldMod180(c4, c6) ? modulo(c6 + 180, 360) : c6;
    const seventhCusp = c7;
    const eighthCusp = shouldMod180(c7, c8) ? modulo(c8 + 180, 360) : c8;
    const ninthCusp = shouldMod180(c7, c9) ? modulo(c9 + 180, 360) : c9;
    const tenthCusp = c10;
    const eleventhCusp = shouldMod180(c10, c11) ? modulo(c11 + 180, 360) : c11;
    const twelthCusp = shouldMod180(c10, c12) ? modulo(c12 + 180, 360) : c12;

    return [
        modulo(firstCusp, 360), modulo(secondCusp, 360), modulo(thirdCusp, 360),
        modulo(fourthCusp, 360), modulo(fifthCusp, 360), modulo(sixthCusp, 360),
        modulo(seventhCusp, 360), modulo(eighthCusp, 360), modulo(ninthCusp, 360),
        modulo(tenthCusp, 360), modulo(eleventhCusp, 360), modulo(twelthCusp, 360)
    ];
};

export const calculatePlacidus = ({ raMC, mc, asc, lat, obliquity = 23.4367 }) => {
    const cuspInterval = (houseNumber) => {
        switch (houseNumber) {
            case 2: return raMC + 120;
            case 3: return raMC + 150;
            case 11: return raMC + 30;
            case 12: return raMC + 60;
            default: return 0;
        }
    };

    const semiArcRatio = (houseNumber) => {
        switch (houseNumber) {
            case 2: return 2 / 3;
            case 3: return 1 / 3;
            case 11: return 1 / 3;
            case 12: return 2 / 3;
            default: return 0;
        }
    };

    const initialCuspalDeclination = (interval) => {
        return Math.asin(sinFromDegrees(obliquity) * sinFromDegrees(interval));
    };

    const calculatedCusp = (houseNumber) => {
        const interval = cuspInterval(houseNumber);
        const saRatio = semiArcRatio(houseNumber);
        let cuspValue = initialCuspalDeclination(interval);
        let prevCuspValue = 0;
        let loops = 0;
        while (Math.abs(cuspValue - prevCuspValue) > 0.001 && loops < 50) {
            loops++;
            const m = Math.atan(saRatio * (tanFromDegrees(lat) / cosFromDegrees(interval)));
            const r = Math.atan((tanFromDegrees(interval) * Math.cos(m)) / Math.cos(m + degreesToRadians(obliquity)));
            prevCuspValue = cuspValue;
            cuspValue = r;
        }
        return radiansToDegrees(cuspValue) + 180;
    };

    return calculateCusps1(asc, mc, calculatedCusp);
};

export const calculateRegiomontanus = ({ raMC, mc, asc, lat, obliquity = 23.4367 }) => {
    const cuspInterval = (houseNumber) => {
        switch (houseNumber) {
            case 2: return 120;
            case 3: return 150;
            case 11: return 30;
            case 12: return 60;
            default: return 0;
        }
    };

    const equatorialInterval = (houseNumber) => raMC + cuspInterval(houseNumber);
    const housePole = (houseNumber) => Math.atan(tanFromDegrees(lat) * sinFromDegrees(cuspInterval(houseNumber)));

    const calculatedCusp = (houseNumber) => {
        const eqint = equatorialInterval(houseNumber);
        const m = Math.atan(Math.tan(housePole(houseNumber)) / cosFromDegrees(eqint));
        const r = Math.atan((tanFromDegrees(eqint) * Math.cos(m)) / Math.cos(m + degreesToRadians(obliquity)));
        return radiansToDegrees(r);
    };

    return calculateCusps1(asc, mc, calculatedCusp);
};

export const calculateKoch = ({ raMC, mc, asc, lat, obliquity = 23.4367 }) => {
    const declinationMC = Math.asin(sinFromDegrees(mc) * sinFromDegrees(obliquity));
    const ascensionalDiff = Math.asin(Math.tan(declinationMC) * tanFromDegrees(lat));
    const obliqueAscensionMC = degreesToRadians(raMC) - ascensionalDiff;
    const cuspDisplacementInterval = modulo(((raMC + 90) - radiansToDegrees(obliqueAscensionMC)) / 3, 360);

    const houseCuspPosition = (houseNumber) => {
        switch (houseNumber) {
            case 11: return radiansToDegrees(obliqueAscensionMC) + cuspDisplacementInterval - 90;
            case 12: return houseCuspPosition(11) + cuspDisplacementInterval;
            case 1: return houseCuspPosition(12) + cuspDisplacementInterval;
            case 2: return houseCuspPosition(1) + cuspDisplacementInterval;
            case 3: return houseCuspPosition(2) + cuspDisplacementInterval;
            default: return 0;
        }
    };

    const calculatedCusp = (houseNumber) => {
        const radians = arccot(-((tanFromDegrees(lat) * sinFromDegrees(obliquity)) + (sinFromDegrees(houseCuspPosition(houseNumber)) * cosFromDegrees(obliquity))) / cosFromDegrees(houseCuspPosition(houseNumber)));
        return radiansToDegrees(radians);
    };

    return calculateCusps1(asc, mc, calculatedCusp);
};

export const calculateTopocentric = ({ raMC, mc, asc, lat, obliquity = 23.4367 }) => {
    const cuspInterval = (houseNumber) => {
        switch (houseNumber) {
            case 2: return raMC + 120;
            case 3: return raMC + 150;
            case 11: return raMC + 30;
            case 12: return raMC + 60;
            default: return 0;
        }
    };

    const semiArcRatio = (houseNumber) => {
        switch (houseNumber) {
            case 2: return Math.atan(2 * (tanFromDegrees(lat) / 3));
            case 3: return Math.atan(tanFromDegrees(lat) / 3);
            case 11: return Math.atan(tanFromDegrees(lat) / 3);
            case 12: return Math.atan(2 * (tanFromDegrees(lat) / 3));
            default: return 0;
        }
    };

    const calculatedCusp = (houseNumber) => {
        const m = Math.atan(Math.tan(semiArcRatio(houseNumber)) / cosFromDegrees(cuspInterval(houseNumber)));
        const r = Math.atan((tanFromDegrees(cuspInterval(houseNumber)) * Math.cos(m)) / Math.cos(m + degreesToRadians(obliquity)));
        return radiansToDegrees(r);
    };

    return calculateCusps1(asc, mc, calculatedCusp);
};

export const calculateEqual = ({ asc }) => {
    return new Array(12).fill(0).map((_, i) => modulo(asc + i * 30, 360));
};

export const calculateWholeSign = ({ asc }) => {
    const ascSignStart = Math.floor(asc / 30) * 30;
    return new Array(12).fill(0).map((_, i) => modulo(ascSignStart + (i * 30), 360));
};

export const calculateHouseCusps = (system, input) => {
    try {
        switch (system) {
            case 'Placidus': return calculatePlacidus(input);
            case 'Koch': return calculateKoch(input);
            case 'Regiomontanus': return calculateRegiomontanus(input);
            case 'Topocentric': return calculateTopocentric(input);
            case 'Equal': return calculateEqual({ asc: input.asc });
            case 'WholeSign': return calculateWholeSign({ asc: input.asc });
            default: return calculatePlacidus(input);
        }
    } catch (e) {
        console.error(`Error calculating ${system} houses, falling back to Equal`, e);
        return calculateEqual({ asc: input.asc });
    }
};

export const getHousePlacement = (absDegree, cusps) => {
    const deg = modulo(absDegree, 360);
    for (let i = 0; i < 12; i++) {
        const cuspStart = cusps[i];
        const cuspEnd = cusps[(i + 1) % 12];
        if (cuspStart < cuspEnd) {
            if (deg >= cuspStart && deg < cuspEnd) return i + 1;
        } else {
            if (deg >= cuspStart || deg < cuspEnd) return i + 1;
        }
    }
    return 1;
};
