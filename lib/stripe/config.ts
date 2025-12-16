import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const STRIPE_CONFIG = {
  currency: 'usd',
  paymentMethods: ['card'],
  subscriptionPrices: {
    monthly: {
      basic: 'price_basic_monthly',
      pro: 'price_pro_monthly',
      enterprise: 'price_enterprise_monthly',
    },
    yearly: {
      basic: 'price_basic_yearly',
      pro: 'price_pro_yearly',
      enterprise: 'price_enterprise_yearly',
    },
  },
};
