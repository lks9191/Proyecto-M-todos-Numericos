// modules/simpson13.js

import { redondear } from '../utils/mathHelpers.js';

export function integracionSimpson13(dias, precios) {
    if (!dias || !precios || dias.length < 2) return 0;
    
    const n = dias.length;
    let integral = 0;
    let i = 0;
    
    while (i < n - 1) {
        if (i + 2 < n) {
            const h1 = dias[i + 1] - dias[i];
            const h2 = dias[i + 2] - dias[i + 1];
            
            if (Math.abs(h1 - h2) < 0.01) {
                const h = h1;
                const area = (h / 3) * (precios[i] + 4 * precios[i + 1] + precios[i + 2]);
                integral += area;
                i += 2;
            } else {
                const h = dias[i + 1] - dias[i];
                integral += (h / 2) * (precios[i] + precios[i + 1]);
                i++;
            }
        } else {
            const h = dias[i + 1] - dias[i];
            integral += (h / 2) * (precios[i] + precios[i + 1]);
            i++;
        }
    }
    
    return redondear(integral);
}

export function calcularGastoTotal(integral, cantidadMensual, diasTotales = 30) {
    const precioPromedioDiario = integral / diasTotales;
    const gastoTotal = precioPromedioDiario * cantidadMensual;
    return {
        precioPromedio: redondear(precioPromedioDiario),
        gastoTotal: redondear(gastoTotal),
        area: integral
    };
}