"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authRoutes = authRoutes;
const supabase_1 = require("../lib/supabase");
const prisma_1 = require("../lib/prisma");
const auth_1 = require("../middleware/auth");
const zod_1 = __importDefault(require("zod"));
const registerSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string().min(8),
});
const loginSchema = zod_1.default.object({
    email: zod_1.default.string().email(),
    password: zod_1.default.string(),
});
async function authRoutes(app) {
    app.post('/register', async (request, reply) => {
        const body = registerSchema.parse(request.body);
        const supabase = (0, supabase_1.getSupabase)();
        const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: body.email,
            password: body.password,
            email_confirm: true,
        });
        if (authError) {
            return reply.status(400).send({ success: false, error: authError.message });
        }
        const user = await prisma_1.prisma.user.create({
            data: { id: authData.user.id, email: body.email },
        });
        return reply.status(201).send({
            success: true,
            data: { id: user.id, email: user.email, role: user.role },
        });
    });
    app.post('/login', async (request, reply) => {
        const body = loginSchema.parse(request.body);
        const supabase = (0, supabase_1.getSupabase)();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: body.email,
            password: body.password,
        });
        if (error) {
            return reply.status(401).send({ success: false, error: 'Invalid credentials' });
        }
        let user = await prisma_1.prisma.user.findUnique({
            where: { id: data.user.id },
        });
        if (!user) {
            user = await prisma_1.prisma.user.create({
                data: { id: data.user.id, email: body.email },
            });
        }
        return reply.send({
            success: true,
            data: {
                user,
                session: {
                    accessToken: data.session.access_token,
                    refreshToken: data.session.refresh_token,
                    expiresAt: data.session.expires_at,
                },
            },
        });
    });
    app.post('/logout', async (_request, reply) => {
        const supabase = (0, supabase_1.getSupabase)();
        await supabase.auth.signOut();
        return reply.send({ success: true, message: 'Logged out successfully' });
    });
    app.post('/reset-password', async (request, reply) => {
        const { email } = zod_1.default.object({ email: zod_1.default.string().email() }).parse(request.body);
        const supabase = (0, supabase_1.getSupabase)();
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${process.env.FRONTEND_URL}/auth/update-password`,
        });
        if (error) {
            return reply.status(400).send({ success: false, error: error.message });
        }
        return reply.send({ success: true, message: 'Password reset email sent' });
    });
    app.get('/me', { preHandler: (0, auth_1.preHandler)() }, async (request, reply) => {
        const userReq = request;
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: userReq.user.id },
        });
        if (!user) {
            return reply.status(404).send({ success: false, error: 'User not found' });
        }
        return reply.send({ success: true, data: user });
    });
}
//# sourceMappingURL=auth.js.map