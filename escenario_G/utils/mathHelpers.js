// utils/mathHelpers.js

export function redondear(num, decimals = 2) {
    if (num === null || isNaN(num)) return 0;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function calcularDerivadas(N, M, D, a, b, c, k, r) {
    const dNdt = -a * N * M + b * D;
    const dMdt = a * N * M - c * M * D;
    const dDdt = k * M - r * D;
    return { dNdt, dMdt, dDdt };
}

export function getDefaultParams() {
    return {
        N0: 900,
        M0: 80,
        D0: 50,
        a: 0.00002,
        b: 0.03,
        c: 0.0005,
        k: 0.08,
        r: 0.05,
        tMax: 30,
        h: 1
    };
}