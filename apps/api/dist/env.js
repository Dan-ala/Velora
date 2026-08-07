"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getEnv = getEnv;
const zod_1 = __importDefault(require("zod"));
const envSchema = zod_1.default.object({
    DATABASE_URL: zod_1.default.string(),
    SUPABASE_URL: zod_1.default.string(),
    SUPABASE_ANON_KEY: zod_1.default.string(),
    SUPABASE_SERVICE_ROLE_KEY: zod_1.default.string(),
    JWT_SECRET: zod_1.default.string().min(32),
    STRIPE_SECRET_KEY: zod_1.default.string().optional(),
    STRIPE_WEBHOOK_SECRET: zod_1.default.string().optional(),
    CLOUDINARY_CLOUD_NAME: zod_1.default.string().optional(),
    CLOUDINARY_API_KEY: zod_1.default.string().optional(),
    CLOUDINARY_API_SECRET: zod_1.default.string().optional(),
    WOMPI_PUBLIC_KEY: zod_1.default.string().optional(),
    WOMPI_PRIVATE_KEY: zod_1.default.string().optional(),
    WOMPI_INTEGRITY_KEY: zod_1.default.string().optional(),
    WOMPI_EVENT_KEY: zod_1.default.string().optional(),
    WOMPI_LIVE: zod_1.default.coerce.boolean().default(false),
    RESEND_API_KEY: zod_1.default.string().optional(),
    RESEND_FROM_EMAIL: zod_1.default.string().default('Velora <pedidos@velora.co>'),
    INTERRAPIDISIMO_USERNAME: zod_1.default.string().optional(),
    INTERRAPIDISIMO_PASSWORD: zod_1.default.string().optional(),
    WHATSAPP_API_KEY: zod_1.default.string().optional(),
    WHATSAPP_PHONE_NUMBER: zod_1.default.string().optional(),
    WHATSAPP_PROVIDER: zod_1.default.enum(['meta', 'twilio', 'wati']).optional().default('meta'),
    FRONTEND_URL: zod_1.default.string().default('http://localhost:3000'),
    PORT: zod_1.default.coerce.number().default(4000),
    NODE_ENV: zod_1.default.enum(['development', 'production', 'test']).default('development'),
});
let env;
function getEnv() {
    if (!env) {
        const result = envSchema.safeParse(process.env);
        if (!result.success) {
            console.error('Invalid environment variables:', result.error.flatten());
            process.exit(1);
        }
        env = result.data;
    }
    return env;
}
//# sourceMappingURL=env.js.map