import type { FastifyRequest, FastifyReply } from 'fastify';
import type { AuthenticatedUser } from '../middleware/auth';

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
    requireAdmin: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

declare module 'http' {
  interface IncomingMessage {
    user?: AuthenticatedUser;
  }
}
