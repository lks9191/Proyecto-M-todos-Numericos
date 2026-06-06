// modules/lagrange.js

import { redondear } from '../utils/mathHelpers.js';

export function interpolacionLagrange(puntos, xEvaluar) {
    if (!puntos || puntos.length === 0) return 0;
    const n = puntos.length;
    let resultado = 0;
    
    for (let i = 0; i < n; i++) {
        let termino = puntos[i].y;
        for (let j = 0; j < n; j++) {
            if (j !== i) {
                termino *= (xEvaluar - puntos[j].x) / (puntos[i].x - puntos[j].x);
            }
        }
        resultado += termino;
    }
    
    return redondear(resultado);
}

export function generarCurvaLagrange(puntos, rangoMin, rangoMax, paso = 0.5) {
    if (!puntos || puntos.length === 0) return [];
    const curva = [];
    for (let x = rangoMin; x <= rangoMax; x += paso) {
        curva.push({
            x: redondear(x, 1),
            y: interpolacionLagrange(puntos, x)
        });
    }
    return curva;
}