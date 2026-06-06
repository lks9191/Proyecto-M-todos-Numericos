// modules/splines.js

import { redondear } from '../utils/mathHelpers.js';

export function calcularSplinesCubicos(puntos) {
    if (!puntos || puntos.length < 2) return [];
    
    const n = puntos.length;
    const h = [];
    const alpha = [];
    const l = [];
    const mu = [];
    const z = [];
    const a = [];
    const b = [];
    const c = [];
    const d = [];
    
    for (let i = 0; i < n; i++) a[i] = puntos[i].y;
    for (let i = 0; i < n - 1; i++) h[i] = puntos[i+1].x - puntos[i].x;
    
    for (let i = 1; i < n - 1; i++) {
        alpha[i] = (3 / h[i]) * (a[i+1] - a[i]) - (3 / h[i-1]) * (a[i] - a[i-1]);
    }
    
    l[0] = 1; mu[0] = 0; z[0] = 0;
    
    for (let i = 1; i < n - 1; i++) {
        l[i] = 2 * (puntos[i+1].x - puntos[i-1].x) - h[i-1] * mu[i-1];
        mu[i] = h[i] / l[i];
        z[i] = (alpha[i] - h[i-1] * z[i-1]) / l[i];
    }
    
    l[n-1] = 1; z[n-1] = 0; c[n-1] = 0;
    
    for (let j = n - 2; j >= 0; j--) {
        c[j] = z[j] - mu[j] * c[j+1];
        b[j] = (a[j+1] - a[j]) / h[j] - h[j] * (c[j+1] + 2 * c[j]) / 3;
        d[j] = (c[j+1] - c[j]) / (3 * h[j]);
    }
    
    const segmentos = [];
    for (let i = 0; i < n - 1; i++) {
        segmentos.push({
            intervalo: [puntos[i].x, puntos[i+1].x],
            a: a[i],
            b: b[i],
            c: c[i],
            d: d[i]
        });
    }
    
    return segmentos;
}

export function interpolacionSplines(puntos, xEvaluar) {
    if (!puntos || puntos.length < 2) return null;
    
    const segmentos = calcularSplinesCubicos(puntos);
    if (segmentos.length === 0) return null;
    
    let segmento = null;
    for (let i = 0; i < segmentos.length; i++) {
        const [xi, xi1] = segmentos[i].intervalo;
        if (xEvaluar >= xi && xEvaluar <= xi1) {
            segmento = segmentos[i];
            break;
        }
    }
    
    if (!segmento && xEvaluar < segmentos[0].intervalo[0]) {
        segmento = segmentos[0];
    } else if (!segmento && xEvaluar > segmentos[segmentos.length-1].intervalo[1]) {
        segmento = segmentos[segmentos.length-1];
    }
    
    if (!segmento) return null;
    
    const xi = segmento.intervalo[0];
    const dx = xEvaluar - xi;
    
    const resultado = segmento.a + segmento.b * dx + segmento.c * Math.pow(dx, 2) + segmento.d * Math.pow(dx, 3);
    return redondear(resultado);
}

export function generarCurvaSplines(puntos, rangoMin, rangoMax, paso = 0.5) {
    if (!puntos || puntos.length < 2) return [];
    const curva = [];
    for (let x = rangoMin; x <= rangoMax; x += paso) {
        const y = interpolacionSplines(puntos, x);
        if (y !== null) {
            curva.push({ x: redondear(x, 1), y: y });
        }
    }
    return curva;
}