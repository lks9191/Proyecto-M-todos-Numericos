// modules/heun.js

import { redondear, calcularDerivadas } from '../utils/mathHelpers.js';

export function simularHeun(params) {
    const { N0, M0, D0, a, b, c, k, r, tMax, h } = params;
    
    const nSteps = Math.ceil(tMax / h);
    const tiempos = [];
    const Ns = [];
    const Ms = [];
    const Ds = [];
    const tabla = [];
    
    let N = N0;
    let M = M0;
    let D = D0;
    
    tiempos.push(0);
    Ns.push(N);
    Ms.push(M);
    Ds.push(D);
    
    for (let i = 0; i < nSteps; i++) {
        const t = i * h;
        
        // k1
        const { dNdt: k1N, dMdt: k1M, dDdt: k1D } = calcularDerivadas(N, M, D, a, b, c, k, r);
        
        // Predictor
        const N_pred = N + h * k1N;
        const M_pred = M + h * k1M;
        const D_pred = D + h * k1D;
        
        // k2
        const { dNdt: k2N, dMdt: k2M, dDdt: k2D } = calcularDerivadas(N_pred, M_pred, D_pred, a, b, c, k, r);
        
        // Corrector
        const N_next = N + (h / 2) * (k1N + k2N);
        const M_next = M + (h / 2) * (k1M + k2M);
        const D_next = D + (h / 2) * (k1D + k2D);
        
        N = N_next;
        M = M_next;
        D = D_next;
        
        const t_next = (i + 1) * h;
        tiempos.push(redondear(t_next));
        Ns.push(redondear(N));
        Ms.push(redondear(M));
        Ds.push(redondear(D));
        
        // Guardar para tabla (cada 5 pasos o al final)
        if (i % 5 === 0 || i === nSteps - 1) {
            tabla.push({
                t: redondear(t_next),
                N: redondear(N),
                M: redondear(M),
                D: redondear(D),
                k1: `(${redondear(k1N)}, ${redondear(k1M)}, ${redondear(k1D)})`,
                k2: `(${redondear(k2N)}, ${redondear(k2M)}, ${redondear(k2D)})`
            });
        }
    }
    
    return { tiempos, Ns, Ms, Ds, tabla };
}