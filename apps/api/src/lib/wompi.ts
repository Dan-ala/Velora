import crypto from 'crypto';
import { getEnv } from '../env';

const BASE_URL = 'https://sandbox.wompi.co/v1';
const LIVE_URL = 'https://api.wompi.co/v1';

function baseUrl() {
  return getEnv().WOMPI_LIVE ? LIVE_URL : BASE_URL;
}

function authHeaders() {
  const env = getEnv();
  return {
    Authorization: `Bearer ${env.WOMPI_PRIVATE_KEY}`,
    'Content-Type': 'application/json',
  };
}

export function generateIntegritySignature(
  amountInCents: number,
  reference: string,
  currency: string,
): string {
  const env = getEnv();
  const hash = crypto.createHash('sha256');
  hash.update(`${amountInCents}${reference}${currency}${env.WOMPI_INTEGRITY_KEY}`);
  return hash.digest('hex');
}

export async function getAcceptanceToken(): Promise<string> {
  const res = await fetch(`${baseUrl()}/merchants/${getEnv().WOMPI_PUBLIC_KEY}`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  return json.data?.presigned_acceptance?.acceptance_token || '';
}

interface CreateTransactionParams {
  amountInCents: number;
  currency?: string;
  reference: string;
  customerEmail: string;
  paymentMethodType: 'PSE' | 'CARD' | 'NEQUI' | 'BANCOLOMBIA_TRANSFER' | 'BANCOLOMBIA_QR';
  paymentMethod?: Record<string, unknown>;
  customerData?: {
    fullName?: string;
    phoneNumber?: string;
    legalId?: string;
    legalIdType?: string;
  };
  redirectUrl?: string;
  ip?: string;
}

export async function createTransaction(params: CreateTransactionParams) {
  const env = getEnv();
  const acceptanceToken = await getAcceptanceToken();
  const signature = generateIntegritySignature(
    params.amountInCents,
    params.reference,
    params.currency || 'COP',
  );

  const body: Record<string, unknown> = {
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
    throw new Error(json.error?.message || `Wompi error: ${res.status}`);
  }

  return json.data;
}

export async function getTransaction(id: string) {
  const res = await fetch(`${baseUrl()}/transactions/${id}`, {
    headers: authHeaders(),
  });
  const json = await res.json();

  if (!res.ok) {
    throw new Error(json.error?.message || `Wompi error: ${res.status}`);
  }

  return json.data;
}

export async function getFinancialInstitutions() {
  const res = await fetch(`${baseUrl()}/pse/financial_institutions`, {
    headers: authHeaders(),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(JSON.stringify(json.error || json));
  }
  return (json.data || []).map((inst: any) => ({
    code: inst.financial_institution_code,
    name: inst.financial_institution_name,
  }));
}

export function verifyWebhookSignature(
  body: string,
  signature: string,
): boolean {
  const env = getEnv();
  if (!env.WOMPI_EVENT_KEY) return false;
  const hash = crypto.createHash('sha256');
  hash.update(body);
  const expected = hash.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

function generateReference(): string {
  const ts = Date.now().toString(36);
  const rand = crypto.randomBytes(4).toString('hex');
  return `VELORA-${ts}-${rand}`;
}

export const wompi = {
  createTransaction,
  getTransaction,
  getFinancialInstitutions,
  getAcceptanceToken,
  generateIntegritySignature,
  verifyWebhookSignature,
  generateReference,
  baseUrl,
};
