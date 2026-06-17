import Stripe from 'stripe';
import { getEnv } from '../env';

const env = getEnv();

export const stripe = env.STRIPE_SECRET_KEY
  ? new Stripe(env.STRIPE_SECRET_KEY, { apiVersion: '2025-02-24.acacia' })
  : null;
