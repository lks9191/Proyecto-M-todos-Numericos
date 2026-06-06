// modules/rk4.js

import { redondear, calcularDerivadas } from '../utils/mathHelpers.js';

export function simularRK4(params) {
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
        
        // k2
        const N_k2 = N + (h / 2) * k1N;
        const M_k2 = M + (h / 2) * k1M;
        const D_k2 = D + (h / 2) * k1D;
        const { dNdt: k2N, dMdt: k2M, dDdt: k2D } = calcularDerivadas(N_k2, M_k2, D_k2, a, b, c, k, r);
        
        // k3
        const N_k3 = N + (h / 2) * k2N;
        const M_k3 = M + (h / 2) * k2M;
        const D_k3 = D + (h / 2) * k2D;
        const { dNdt: k3N, dMdt: k3M, dDdt: k3D } = calcularDerivadas(N_k3, M_k3, D_k3, a, b, c, k, r);
        
        // k4
        const N_k4 = N + h * k3N;
        const M_k4 = M + h * k3M;
        const D_k4 = D + h * k3D;
        const { dNdt: k4N, dMdt: k4M, dDdt: k4D } = calcularDerivadas(N_k4, M_k4, D_k4, a, b, c, k, r);
        
        // Actualizar
        const N_next = N + (h / 6) * (k1N + 2 * k2N + 2 * k3N + k4N);
        const M_next = M + (h / 6) * (k1M + 2 * k2M + 2 * k3M + k4M);
        const D_next = D + (h / 6) * (k1D + 2 * k2D + 2 * k3D + k4D);
        
        N = N_next;
        M = M_next;
        D = D_next;
        
        const t_next = (i + 1) * h;
        tiempos.push(redondear(t_next));
        Ns.push(redondear(N));
        Ms.push(redondear(M));
        Ds.push(redondear(D));
        
        // Guardar para tabla
        if (i % 5 === 0 || i === nSteps - 1) {
            tabla.push({
                t: redondear(t_next),
                N: redondear(N),
                M: redondear(M),
                D: redondear(D),
                k1: `(${redondear(k1N)}, ${redondear(k1M)}, ${redondear(k1D)})`,
                k2: `(${redondear(k2N)}, ${redondear(k2M)}, ${redondear(k2D)})`,
                k3: `(${redondear(k3N)}, ${redondear(k3M)}, ${redondear(k3D)})`,
                k4: `(${redondear(k4N)}, ${redondear(k4M)}, ${redondear(k4D)})`
            });
        }
    }
    
    return { tiempos, Ns, Ms, Ds, tabla };
}