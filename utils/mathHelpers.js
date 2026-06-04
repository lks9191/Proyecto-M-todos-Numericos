// utils/mathHelpers.js

export function redondear(num, decimals = 2) {
    if (num === null || isNaN(num)) return 0;
    return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

export function interpolarLineal(x0, y0, x1, y1, x) {
    if (x1 === x0) return y0;
    const t = (x - x0) / (x1 - x0);
    return y0 + t * (y1 - y0);
}

export function generarCurvaContinua(dias, precios, rangoMin, rangoMax, paso = 0.2) {
    const curva = [];
    for (let x = rangoMin; x <= rangoMax; x += paso) {
        let y = 0;
        if (x <= dias[0]) {
            y = precios[0];
        } else if (x >= dias[dias.length - 1]) {
            y = precios[precios.length - 1];
        } else {
            for (let i = 0; i < dias.length - 1; i++) {
                if (x >= dias[i] && x <= dias[i + 1]) {
                    y = interpolarLineal(dias[i], precios[i], dias[i + 1], precios[i + 1], x);
                    break;
                }
            }
        }
        curva.push({ x: redondear(x, 1), y: redondear(y, 2) });
    }
    return curva;
}

export const productosDataDefault = {
    "Papa": { dias: [1, 5, 10, 15, 20, 30], precios: [8, 10, 13, 16, 19, 22], cantidad: 10 },
    "Arroz": { dias: [1, 5, 10, 15, 20, 30], precios: [6, 7, 8.5, 10, 11, 13], cantidad: 8 },
    "Aceite": { dias: [1, 5, 10, 15, 20, 30], precios: [12, 13, 14.5, 16, 18, 22], cantidad: 2 },
    "Pan": { dias: [1, 5, 10, 15, 20, 30], precios: [2, 2.5, 3, 3.5, 4, 5], cantidad: 30 },
    "Azucar": { dias: [1, 5, 10, 15, 20, 30], precios: [5, 5.5, 6.5, 7.5, 8.5, 11], cantidad: 5 },
    "Carne": { dias: [1, 5, 10, 15, 20, 30], precios: [25, 27, 30, 33, 36, 42], cantidad: 5 }
};

export function getDefaultData(productoNombre) {
    if (productosDataDefault[productoNombre]) {
        const data = productosDataDefault[productoNombre];
        return {
            dias: [...data.dias],
            precios: [...data.precios],
            cantidad: data.cantidad
        };
    }
    return { dias: [1, 10, 20, 30], precios: [10, 15, 20, 25], cantidad: 5 };
}