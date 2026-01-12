/**
 * Payment Service
 * 
 * Handles payment processing using Stripe.
 */

import Stripe from 'stripe';
import { query } from '../config/database';
import { logger } from '../utils/logger';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-11-20.acacia',
});

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret?: string;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  error?: string;
}

export class PaymentService {
  /**
   * Create a payment intent
   */
  async createPaymentIntent(
    amount: number,
    currency: string = 'usd',
    userId: string,
    metadata?: Record<string, string>
  ): Promise<PaymentResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        metadata: {
          userId,
          ...metadata,
        },
      });

      // Store payment intent in database
      await query(
        `INSERT INTO payments (payment_intent_id, user_id, amount, currency, status, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          paymentIntent.id,
          userId,
          amount,
          currency,
          paymentIntent.status,
        ]
      );

      logger.info('Payment intent created:', {
        paymentIntentId: paymentIntent.id,
        userId,
        amount,
      });

      return {
        success: true,
        paymentIntentId: paymentIntent.id,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error: any) {
      logger.error('Payment intent creation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Confirm a payment intent
   */
  async confirmPayment(paymentIntentId: string): Promise<PaymentResult> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

      if (paymentIntent.status === 'succeeded') {
        // Update database
        await query(
          `UPDATE payments SET status = 'succeeded', updated_at = NOW()
           WHERE payment_intent_id = $1`,
          [paymentIntentId]
        );

        logger.info('Payment confirmed:', { paymentIntentId });
        return { success: true, paymentIntentId };
      }

      return {
        success: false,
        error: `Payment status: ${paymentIntent.status}`,
      };
    } catch (error: any) {
      logger.error('Payment confirmation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Handle Stripe webhook
   */
  async handleWebhook(event: Stripe.Event): Promise<void> {
    try {
      switch (event.type) {
        case 'payment_intent.succeeded':
          await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
          break;
        case 'charge.refunded':
          await this.handleRefund(event.data.object as Stripe.Charge);
          break;
        default:
          logger.info('Unhandled webhook event:', event.type);
      }
    } catch (error: any) {
      logger.error('Webhook handling error:', error);
      throw error;
    }
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await query(
      `UPDATE payments SET status = 'succeeded', updated_at = NOW()
       WHERE payment_intent_id = $1`,
      [paymentIntent.id]
    );

    // If this is for a license purchase, create the license
    if (paymentIntent.metadata?.licenseType) {
      await this.createLicenseFromPayment(paymentIntent);
    }

    logger.info('Payment succeeded:', { paymentIntentId: paymentIntent.id });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    await query(
      `UPDATE payments SET status = 'failed', updated_at = NOW()
       WHERE payment_intent_id = $1`,
      [paymentIntent.id]
    );

    logger.warn('Payment failed:', { paymentIntentId: paymentIntent.id });
  }

  /**
   * Handle refund
   */
  private async handleRefund(charge: Stripe.Charge): Promise<void> {
    await query(
      `UPDATE payments SET status = 'refunded', updated_at = NOW()
       WHERE payment_intent_id = $1`,
      [charge.payment_intent as string]
    );

    logger.info('Payment refunded:', { chargeId: charge.id });
  }

  /**
   * Create license from payment
   */
  private async createLicenseFromPayment(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    const userId = paymentIntent.metadata?.userId;
    const licenseType = paymentIntent.metadata?.licenseType;

    if (!userId || !licenseType) {
      logger.warn('Missing metadata for license creation:', { paymentIntentId: paymentIntent.id });
      return;
    }

    // Create license (will be implemented in license service)
    logger.info('License creation triggered:', { userId, licenseType });
  }

  /**
   * Get payment history for a user
   */
  async getPaymentHistory(userId: string, limit: number = 50): Promise<any[]> {
    try {
      const result = await query(
        `SELECT payment_intent_id, amount, currency, status, created_at
         FROM payments
         WHERE user_id = $1
         ORDER BY created_at DESC
         LIMIT $2`,
        [userId, limit]
      );

      return result.rows;
    } catch (error: any) {
      logger.error('Get payment history failed:', error);
      throw error;
    }
  }

  /**
   * Create refund
   */
  async createRefund(paymentIntentId: string, amount?: number): Promise<PaymentResult> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined,
      });

      await query(
        `UPDATE payments SET status = 'refunded', updated_at = NOW()
         WHERE payment_intent_id = $1`,
        [paymentIntentId]
      );

      logger.info('Refund created:', { refundId: refund.id, paymentIntentId });

      return {
        success: true,
        paymentIntentId,
      };
    } catch (error: any) {
      logger.error('Refund creation failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

export const paymentService = new PaymentService();

