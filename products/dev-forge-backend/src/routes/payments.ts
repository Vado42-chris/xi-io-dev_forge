/**
 * Payment Routes
 * 
 * Payment processing endpoints.
 */

import { Router, Request, Response } from 'express';
import { authenticate, AuthRequest } from '../middleware/auth';
import { paymentService } from '../services/paymentService';
import { logger } from '../utils/logger';
import { z } from 'zod';
import Stripe from 'stripe';

const router = Router();

// Validation schemas
const createPaymentSchema = z.object({
  amount: z.number().positive(),
  currency: z.string().default('usd'),
  metadata: z.record(z.string()).optional(),
});

const refundSchema = z.object({
  paymentIntentId: z.string(),
  amount: z.number().positive().optional(),
});

/**
 * POST /api/payments/create-intent
 * Create a payment intent
 */
router.post('/create-intent', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validated = createPaymentSchema.parse(req.body);
    const { amount, currency, metadata } = validated;

    const result = await paymentService.createPaymentIntent(
      amount,
      currency,
      req.user.id,
      metadata
    );

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      paymentIntentId: result.paymentIntentId,
      clientSecret: result.clientSecret,
    });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Create payment intent error:', error);
    res.status(500).json({ error: 'Failed to create payment intent' });
  }
});

/**
 * POST /api/payments/confirm
 * Confirm a payment
 */
router.post('/confirm', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { paymentIntentId } = req.body;

    if (!paymentIntentId) {
      return res.status(400).json({ error: 'Payment intent ID required' });
    }

    const result = await paymentService.confirmPayment(paymentIntentId);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, paymentIntentId });
  } catch (error: any) {
    logger.error('Confirm payment error:', error);
    res.status(500).json({ error: 'Failed to confirm payment' });
  }
});

/**
 * GET /api/payments/history
 * Get payment history
 */
router.get('/history', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 50;
    const history = await paymentService.getPaymentHistory(req.user.id, limit);

    res.json({ payments: history });
  } catch (error: any) {
    logger.error('Get payment history error:', error);
    res.status(500).json({ error: 'Failed to get payment history' });
  }
});

/**
 * POST /api/payments/refund
 * Create a refund
 */
router.post('/refund', authenticate, async (req: AuthRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const validated = refundSchema.parse(req.body);
    const { paymentIntentId, amount } = validated;

    const result = await paymentService.createRefund(paymentIntentId, amount);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({ success: true, paymentIntentId });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    logger.error('Refund error:', error);
    res.status(500).json({ error: 'Failed to create refund' });
  }
});

/**
 * POST /api/payments/webhook
 * Stripe webhook endpoint
 */
router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'];

  if (!sig) {
    return res.status(400).json({ error: 'Missing stripe-signature header' });
  }

  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
      apiVersion: '2024-11-20.acacia',
    });

    const event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET || ''
    );

    await paymentService.handleWebhook(event);

    res.json({ received: true });
  } catch (error: any) {
    logger.error('Webhook error:', error);
    res.status(400).json({ error: `Webhook Error: ${error.message}` });
  }
});

export default router;

