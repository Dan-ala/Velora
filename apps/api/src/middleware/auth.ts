import type { FastifyRequest, FastifyReply } from 'fastify';
import { getSupabase } from '../lib/supabase';
import { prisma } from '../lib/prisma';
import type { Role } from '@prisma/client';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

async function verifyToken(request: FastifyRequest): Promise<AuthenticatedUser | null> {
  const authHeader = request.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;

  const token = authHeader.slice(7);
  const supabase = getSupabase();
  const { data: { user: supabaseUser }, error } = await supabase.auth.getUser(token);

  if (error || !supabaseUser) return null;

  const dbUser = await prisma.user.findUnique({
    where: { id: supabaseUser.id },
  });

  if (!dbUser) return null;

  return { id: dbUser.id, email: dbUser.email, role: dbUser.role };
}

export function preHandler(requiredRole?: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await verifyToken(request);

    if (!user) {
      return reply.status(401).send({ success: false, error: 'Unauthorized' });
    }

    if (requiredRole && user.role !== requiredRole) {
      return reply.status(403).send({ success: false, error: 'Forbidden' });
    }

    (request as any).user = user;
  };
}

export { verifyToken };
