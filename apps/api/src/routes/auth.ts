import type { FastifyInstance } from 'fastify';
import { getSupabase, getSupabaseAnon } from '../lib/supabase';
import { isDisposableEmail } from '../lib/disposable-email-domains';
import { checkEmailDomain } from '../lib/email-domain-check';
import { prisma } from '../lib/prisma';
import { preHandler } from '../middleware/auth';
import { getEnv } from '../env';
import z from 'zod';

// Secure Password Regex Pattern: requires at least one lowercase letter,
// one uppercase letter, one digit, one special character, and a 10-72
// character length — all in a single pattern via lookaheads. No
// dictionary/word-list needed.
const SECURE_PASSWORD_REGEX =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[A-Za-z\d\S]{10,72}$/;

const registerSchema = z.object({
  email: z
    .string()
    .email()
    .refine((email) => !isDisposableEmail(email), {
      message: 'Please use a permanent email address (temporary/disposable emails are not allowed).',
    }),
  password: z
    .string()
    .regex(
      SECURE_PASSWORD_REGEX,
      'Password must be 10-72 characters and include an uppercase letter, a lowercase letter, a number, and a special character'
    ),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

export async function authRoutes(app: FastifyInstance) {
  app.post('/register', async (request, reply) => {
    const body = registerSchema.parse(request.body);
    const env = getEnv();

    // Confirm the domain can actually receive mail before we bother
    // Supabase with it. Fails closed: if we can't determine an answer
    // (our own DNS lookup erroring/timing out), we block and ask the
    // person to retry rather than risk letting a fake domain through.
    const domainCheck = await checkEmailDomain(body.email);
    if (!domainCheck.ok) {
      if (domainCheck.reason === 'no-mail-domain') {
        return reply.status(400).send({
          success: false,
          error: "This email domain can't receive mail. Please check for typos or use a different address.",
        });
      }
      return reply.status(503).send({
        success: false,
        error: 'Could not verify your email right now. Please try again in a moment.',
      });
    }

    // IMPORTANT: this uses the anon-key client and Supabase's normal
    // signUp() flow, NOT admin.createUser(email_confirm: true). That
    // previous approach marked every account as verified immediately,
    // which is why fake/nonexistent emails were able to register.
    // signUp() sends a real confirmation email and Supabase will refuse
    // to log the account in (see /login) until the link is clicked.
    const supabaseAnon = getSupabaseAnon();
    const { data: authData, error: authError } = await supabaseAnon.auth.signUp({
      email: body.email,
      password: body.password,
      options: {
        emailRedirectTo: `${env.FRONTEND_URL}/auth/confirm`,
      },
    });

    if (authError) {
      return reply.status(400).send({ success: false, error: authError.message });
    }

    if (!authData.user) {
      return reply.status(400).send({ success: false, error: 'Could not create account' });
    }

    // Supabase returns a user with an empty identities array when the
    // email already exists (it won't error, to avoid leaking which emails
    // are registered). Treat that the same as a duplicate-account error.
    if (authData.user.identities && authData.user.identities.length === 0) {
      return reply.status(400).send({ success: false, error: 'An account with this email already exists' });
    }

    const user = await prisma.user.create({
      data: { id: authData.user.id, email: body.email },
    });

    return reply.status(201).send({
      success: true,
      data: { id: user.id, email: user.email, role: user.role, confirmationRequired: true },
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
      if (error.message.toLowerCase().includes('email not confirmed')) {
        return reply.status(403).send({
          success: false,
          error: 'Please confirm your email before logging in. Check your inbox for the confirmation link.',
        });
      }
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
      redirectTo: `${process.env.FRONTEND_URL}/auth/update-password`,
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