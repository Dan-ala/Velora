declare function baseUrl(): "https://sandbox.wompi.co/v1" | "https://production.wompi.co/v1";
export declare function generateIntegritySignature(amountInCents: number, reference: string, currency: string): string;
export declare function getAcceptanceToken(): Promise<string>;
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
export declare function createTransaction(params: CreateTransactionParams): Promise<any>;
export declare function getTransaction(id: string): Promise<any>;
export declare function getTransactionByReference(reference: string): Promise<any>;
export declare function getFinancialInstitutions(): Promise<any>;
/**
 * Verifies a Wompi webhook event signature using the in-body signature fields.
 * The payload is built from the transaction properties listed in signature.properties,
 * concatenated with the timestamp and event key.
 */
export declare function verifyWebhookEvent(event: Record<string, any>): boolean;
export declare function verifyWebhookSignature(body: string, signature: string): boolean;
declare function generateReference(): string;
export declare const wompi: {
    createTransaction: typeof createTransaction;
    getTransaction: typeof getTransaction;
    getTransactionByReference: typeof getTransactionByReference;
    getFinancialInstitutions: typeof getFinancialInstitutions;
    getAcceptanceToken: typeof getAcceptanceToken;
    generateIntegritySignature: typeof generateIntegritySignature;
    verifyWebhookSignature: typeof verifyWebhookSignature;
    verifyWebhookEvent: typeof verifyWebhookEvent;
    generateReference: typeof generateReference;
    baseUrl: typeof baseUrl;
};
export {};
