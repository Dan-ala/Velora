import type { FastifyInstance } from 'fastify';
import { getSupabase } from '../lib/supabase';
import { prisma } from '../lib/prisma';
import { preHandler } from '../middleware/auth';
import z from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const supabase = getSupabase();

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email,
      password: body.password,
      email_confirm: true,
    });

    if (authError) {
      return reply.status(400).send({ success: false, error: authError.message });
    }

    const user = await prisma.user.create({
      data: { id: authData.user.id, email: body.email },
    });

    return reply.status(201).send({
      success: true,
      data: { id: user.id, email: user.email, role: user.role },
    });
  });

  app.post('/login', async (request, reply) => {
    const body = loginSchema.parse(request.body);
    const supabase = getSupabase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: body.email,
      password: body.password,
    });

    if (error) {
      return reply.status(401).send({ success: false, error: 'Invalid credentials' });
    }

    let user = await prisma.user.findUnique({
      where: { id: data.user.id },
    });

    if (!user) {
      user = await prisma.user.create({
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
    const supabase = getSupabase();
    await supabase.auth.signOut();
    return reply.send({ success: true, message: 'Logged out successfully' });
  });

  app.post('/reset-password', async (request, reply) => {
    const { email } = z.object({ email: z.string().email() }).parse(request.body);
    const supabase = getSupabase();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.FRONTEND_URL}/auth/reset-password`,
    });

    if (error) {
      return reply.status(400).send({ success: false, error: error.message });
    }

    return reply.send({ success: true, message: 'Password reset email sent' });
  });

  app.get('/me', { preHandler: preHandler() }, async (request, reply) => {
    const userReq = request as any;
    const user = await prisma.user.findUnique({
      where: { id: userReq.user.id },
    });

    if (!user) {
      return reply.status(404).send({ success: false, error: 'User not found' });
    }

    return reply.send({ success: true, data: user });
  });
}
