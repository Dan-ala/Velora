"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterrapidisimoProvider = void 0;
const env_1 = require("../env");
const BASE_URL = 'https://api.interrapidisimo.com';
const TEST_URL = 'https://api.test.interrapidisimo.com';
function isConfigured() {
    const env = (0, env_1.getEnv)();
    return !!(env.INTERRAPIDISIMO_USERNAME && env.INTERRAPIDISIMO_PASSWORD);
}
function baseUrl() {
    return (0, env_1.getEnv)().NODE_ENV === 'production' ? BASE_URL : TEST_URL;
}
async function authToken() {
    const env = (0, env_1.getEnv)();
    if (!env.INTERRAPIDISIMO_USERNAME || !env.INTERRAPIDISIMO_PASSWORD)
        return null;
    const res = await fetch(`${baseUrl()}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            username: env.INTERRAPIDISIMO_USERNAME,
            password: env.INTERRAPIDISIMO_PASSWORD,
        }),
    });
    if (!res.ok)
        return null;
    const data = await res.json();
    return data.token || null;
}
function generateGuideNumber() {
    const ts = Date.now().toString().slice(-8);
    const rand = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `IR-${ts}-${rand}`;
}
class InterrapidisimoProvider {
    async createShipment(params) {
        const token = await authToken();
        if (!token) {
            const guideNumber = generateGuideNumber();
            return {
                guideNumber,
                trackingUrl: `https://seguimiento.interrapidisimo.com/${guideNumber}`,
                labelUrl: null,
                barcodeUrl: null,
                cost: 15000,
            };
        }
        const payload = {
            guias: [
                {
                    numero_remision: params.reference || params.orderId,
                    destinatario: {
                        nombre: params.userEmail,
                        direccion: params.destinationAddress || '',
                        ciudad: params.destinationCity || '',
                        email: params.userEmail,
                    },
                    contenido: params.items.map((i) => `${i.quantity}x ${i.product.name}`).join(', '),
                    valor_declarado: params.items.reduce((sum, i) => sum + i.price * i.quantity, 0),
                    peso_estimado: params.items.length * 0.5,
                },
            ],
        };
        const res = await fetch(`${baseUrl()}/api/guias`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(payload),
        });
        if (!res.ok) {
            throw new Error(`Inter Rapidísimo API error: ${res.status}`);
        }
        const data = await res.json();
        const guia = data.guias?.[0];
        return {
            guideNumber: guia?.numero_guia || generateGuideNumber(),
            trackingUrl: guia?.url_seguimiento
                ? `https://seguimiento.interrapidisimo.com/${guia.numero_guia}`
                : null,
            labelUrl: guia?.url_etiqueta || null,
            barcodeUrl: guia?.url_codigo_barras || null,
            cost: guia?.valor_flete || 15000,
        };
    }
    async getTracking(guideNumber) {
        const token = await authToken();
        if (!token) {
            return {
                status: 'EN_TRANSITO',
                events: [
                    { date: new Date().toISOString(), description: 'Paquete en tránsito', location: 'Bogotá' },
                ],
            };
        }
        const res = await fetch(`${baseUrl()}/api/guias/${guideNumber}/seguimiento`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) {
            throw new Error(`Inter Rapidísimo tracking error: ${res.status}`);
        }
        const data = await res.json();
        return {
            status: data.estado || 'EN_TRANSITO',
            events: (data.eventos || []).map((e) => ({
                date: e.fecha,
                description: e.descripcion,
                location: e.ciudad,
            })),
            estimatedDelivery: data.fecha_estimada_entrega,
        };
    }
    async cancelShipment(guideNumber) {
        const token = await authToken();
        if (!token)
            return false;
        try {
            const res = await fetch(`${baseUrl()}/api/guias/${guideNumber}/cancelar`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            });
            return res.ok;
        }
        catch {
            return false;
        }
    }
    async getRates(destination, weight) {
        return [
            { service: 'Estandar', cost: 15000, estimatedDays: '3-5' },
            { service: 'Express', cost: 25000, estimatedDays: '1-2' },
        ];
    }
}
exports.InterrapidisimoProvider = InterrapidisimoProvider;
//# sourceMappingURL=interrapidisimo.provider.js.map