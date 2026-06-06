// modules/newton.js

import { redondear } from '../utils/mathHelpers.js';

export function calcularDiferenciasDivididas(puntos) {
    const n = puntos.length;
    const tabla = [];
    
    for (let i = 0; i < n; i++) {
        tabla[i] = [puntos[i].y];
    }
    
    for (let j = 1; j < n; j++) {
        for (let i = 0; i < n - j; i++) {
            const numerador = tabla[i+1][j-1] - tabla[i][j-1];
            const denominador = puntos[i+j].x - puntos[i].x;
            tabla[i][j] = denominador !== 0 ? numerador / denominador : 0;
        }
    }
    
    return tabla;
}

export function interpolacionNewton(puntos, xEvaluar) {
    if (!puntos || puntos.length === 0) return 0;
    const n = puntos.length;
    const tabla = calcularDiferenciasDivididas(puntos);
    let resultado = tabla[0][0];
    let producto = 1;
    
    for (let i = 1; i < n; i++) {
        producto *= (xEvaluar - puntos[i-1].x);
        resultado += tabla[0][i] * producto;
    }
    
    return redondear(resultado);
}

export function generarTablaNewtonFormateada(puntos) {
    const tabla = calcularDiferenciasDivididas(puntos);
    const n = puntos.length;
    
    const filas = [];
    for (let i = 0; i < n; i++) {
        const fila = { x: puntos[i].x, f0: redondear(tabla[i][0]) };
        for (let j = 1; j <= i; j++) {
            fila[`f${j}`] = redondear(tabla[i-j][j]);
        }
        filas.push(fila);
    }
    
    return { filas };
}

export function generarCurvaNewton(puntos, rangoMin, rangoMax, paso = 0.5) {
    if (!puntos || puntos.length === 0) return [];
    const curva = [];
    for (let x = rangoMin; x <= rangoMax; x += paso) {
        curva.push({
            x: redondear(x, 1),
            y: interpolacionNewton(puntos, x)
        });
    }
    return curva;
}