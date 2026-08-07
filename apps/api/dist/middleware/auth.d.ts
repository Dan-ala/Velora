import type { FastifyRequest, FastifyReply } from 'fastify';
import type { Role } from '@prisma/client';
export interface AuthenticatedUser {
    id: string;
    email: string;
    role: Role;
}
declare function verifyToken(request: FastifyRequest): Promise<AuthenticatedUser | null>;
export declare function preHandler(requiredRole?: Role): (request: FastifyRequest, reply: FastifyReply) => Promise<undefined>;
export { verifyToken };
