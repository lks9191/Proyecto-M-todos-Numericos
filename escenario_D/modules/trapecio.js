// modules/trapecio.js

import { redondear } from '../utils/mathHelpers.js';

export function integracionTrapecioConDetalle(dias, precios) {
    if (!dias || !precios || dias.length < 2) return { integral: 0, detalles: [] };
    
    let integral = 0;
    const detalles = [];
    
    for (let i = 0; i < dias.length - 1; i++) {
        const h = dias[i + 1] - dias[i];
        const area = (h / 2) * (precios[i] + precios[i + 1]);
        integral += area;
        detalles.push({
            segmento: i + 1,
            intervalo: `[${dias[i]}, ${dias[i + 1]}]`,
            h: redondear(h),
            area: redondear(area)
        });
    }
    
    return { integral: redondear(integral), detalles };
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