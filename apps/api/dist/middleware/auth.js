"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preHandler = preHandler;
exports.verifyToken = verifyToken;
const supabase_1 = require("../lib/supabase");
const prisma_1 = require("../lib/prisma");
async function verifyToken(request) {
    const authHeader = request.headers.authorization;
    if (!authHeader?.startsWith('Bearer '))
        return null;
    const token = authHeader.slice(7);
    const supabase = (0, supabase_1.getSupabase)();
    const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);
    if (error || !supabaseUser)
        return null;
    const dbUser = await prisma_1.prisma.user.findUnique({
        where: { id: supabaseUser.id },
    });
    if (!dbUser)
        return null;
    return { id: dbUser.id, email: dbUser.email, role: dbUser.role };
}
function preHandler(requiredRole) {
    return async (request, reply) => {
        const user = await verifyToken(request);
        if (!user) {
            return reply.status(401).send({ success: false, error: 'Unauthorized' });
        }
        if (requiredRole && user.role !== requiredRole) {
            return reply.status(403).send({ success: false, error: 'Forbidden' });
        }
        request.user = user;
    };
}
//# sourceMappingURL=auth.js.map