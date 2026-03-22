export const arccot = (x) => {
    return Math.PI / 2 - Math.atan(x);
};

export const degreesToRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

export const radiansToDegrees = (radians) => {
    return radians * (180 / Math.PI);
};

export const sinFromDegrees = (degrees) => Math.sin(degreesToRadians(degrees));
export const cosFromDegrees = (degrees) => Math.cos(degreesToRadians(degrees));
export const tanFromDegrees = (degrees) => Math.tan(degreesToRadians(degrees));

export const modulo = (number, mod) => {
    return ((number % mod) + mod) % mod;
};

export const normalizeDegrees = (d) => modulo(d, 360);
