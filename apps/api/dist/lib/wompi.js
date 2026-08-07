"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.wompi = void 0;
exports.generateIntegritySignature = generateIntegritySignature;
exports.getAcceptanceToken = getAcceptanceToken;
exports.createTransaction = createTransaction;
exports.getTransaction = getTransaction;
exports.getTransactionByReference = getTransactionByReference;
exports.getFinancialInstitutions = getFinancialInstitutions;
exports.verifyWebhookEvent = verifyWebhookEvent;
exports.verifyWebhookSignature = verifyWebhookSignature;
const crypto_1 = __importDefault(require("crypto"));
const env_1 = require("../env");
const BASE_URL = 'https://sandbox.wompi.co/v1';
const LIVE_URL = 'https://production.wompi.co/v1';
function baseUrl() {
    return (0, env_1.getEnv)().WOMPI_LIVE ? LIVE_URL : BASE_URL;
}
function authHeaders() {
    const env = (0, env_1.getEnv)();
    return {
        Authorization: `Bearer ${env.WOMPI_PRIVATE_KEY}`,
        'Content-Type': 'application/json',
    };
}
function generateIntegritySignature(amountInCents, reference, currency) {
    const env = (0, env_1.getEnv)();
    const hash = crypto_1.default.createHash('sha256');
    hash.update(`${reference}${amountInCents}${currency}${env.WOMPI_INTEGRITY_KEY}`);
    return hash.digest('hex');
}
async function getAcceptanceToken() {
    const res = await fetch(`${baseUrl()}/merchants/${(0, env_1.getEnv)().WOMPI_PUBLIC_KEY}`, {
        headers: authHeaders(),
    });
    const json = await res.json();
    return json.data?.presigned_acceptance?.acceptance_token || '';
}
async function createTransaction(params) {
    const env = (0, env_1.getEnv)();
    const acceptanceToken = await getAcceptanceToken();
    const signature = generateIntegritySignature(params.amountInCents, params.reference, params.currency || 'COP');
    const body = {
        acceptance_token: acceptanceToken,
        amount_in_cents: params.amountInCents,
        currency: params.currency || 'COP',
        reference: params.reference,
        signature,
        customer_email: params.customerEmail,
        payment_method_type: params.paymentMethodType,
        ...(params.paymentMethod ? { payment_method: params.paymentMethod } : {}),
        ...(params.customerData
            ? {
                customer_data: {
                    full_name: params.customerData.fullName,
                    phone_number: params.customerData.phoneNumber,
                    legal_id: params.customerData.legalId,
                    legal_id_type: params.customerData.legalIdType,
                },
            }
            : {}),
        ...(params.redirectUrl ? { redirect_url: params.redirectUrl } : {}),
        ...(params.ip ? { ip_address: params.ip } : {}),
    };
    const res = await fetch(`${baseUrl()}/transactions`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(body),
    });
    const json = await res.json();
    if (!res.ok) {
        const detail = json.error?.messages
            ? Object.entries(json.error.messages).map(([k, v]) => {
                const val = Array.isArray(v) ? v.join(', ') : typeof v === 'object' ? JSON.stringify(v) : v;
                return `${k}: ${val}`;
            }).join('; ')
            : json.error?.message || JSON.stringify(json.error);
        throw new Error(`Wompi error (${res.status}): ${detail}`);
    }
    return json.data;
}
async function getTransaction(id) {
    const res = await fetch(`${baseUrl()}/transactions/${id}`, {
        headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(json.error?.message || `Wompi error: ${res.status}`);
    }
    return json.data;
}
async function getTransactionByReference(reference) {
    const res = await fetch(`${baseUrl()}/transactions?reference=${encodeURIComponent(reference)}`, {
        headers: authHeaders(),
    });
    if (!res.ok)
        return null;
    const json = await res.json();
    return json.data?.[0] || null;
}
async function getFinancialInstitutions() {
    const res = await fetch(`${baseUrl()}/pse/financial_institutions`, {
        headers: authHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
        throw new Error(JSON.stringify(json.error || json));
    }
    return (json.data || []).map((inst) => ({
        code: inst.financial_institution_code,
        name: inst.financial_institution_name,
    }));
}
/**
 * Verifies a Wompi webhook event signature using the in-body signature fields.
 * The payload is built from the transaction properties listed in signature.properties,
 * concatenated with the timestamp and event key.
 */
function verifyWebhookEvent(event) {
    const env = (0, env_1.getEnv)();
    const { signature, timestamp } = event;
    if (!signature?.properties || !signature?.checksum || !timestamp)
        return false;
    if (!env.WOMPI_EVENT_KEY)
        return false;
    const tx = event.data?.transaction;
    if (!tx)
        return false;
    const values = signature.properties.map((prop) => String(tx[prop] ?? ''));
    const payload = values.join('') + String(timestamp) + env.WOMPI_EVENT_KEY;
    const hash = crypto_1.default.createHash('sha256').update(payload).digest('hex');
    try {
        return crypto_1.default.timingSafeEqual(Buffer.from(hash), Buffer.from(signature.checksum));
    }
    catch {
        return false;
    }
}
function verifyWebhookSignature(body, signature) {
    const env = (0, env_1.getEnv)();
    if (!env.WOMPI_EVENT_KEY)
        return false;
    const hash = crypto_1.default.createHash('sha256');
    hash.update(body);
    const expected = hash.digest('hex');
    return crypto_1.default.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}
function generateReference() {
    const ts = Date.now().toString(36);
    const rand = crypto_1.default.randomBytes(4).toString('hex');
    return `VELORA-${ts}-${rand}`;
}
exports.wompi = {
    createTransaction,
    getTransaction,
    getTransactionByReference,
    getFinancialInstitutions,
    getAcceptanceToken,
    generateIntegritySignature,
    verifyWebhookSignature,
    verifyWebhookEvent,
    generateReference,
    baseUrl,
};
//# sourceMappingURL=wompi.js.map