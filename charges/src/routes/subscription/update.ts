import express, { Request, Response } from 'express';
import { Subscription } from '../../models/subscriptions';
import {
  requireAuth,
  requireUserRole,
  UserRoles,
  validateRequest,
  SubscriptionType,
  NotFoundError,
} from '@theartisans/shared/build';
import { body, param } from 'express-validator';

const router = express.Router();

const requireRole = requireUserRole([
  UserRoles.Admin,
  UserRoles.Moderator,
  UserRoles.Developer,
]);
router.put(
  '/api/charges/subscription/:name',
  requireAuth,
  requireRole,
  [
    body('price').isFloat({ gt: 0 }).withMessage('Price is required'),
    body('benefits').isArray().withMessage('Benefits is required'),
    param('name')
      .isIn(Object.values(SubscriptionType))
      .withMessage('valid subscription param name is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { price, benefits } = req.body;
    const name = req.params.name;
    const subscription = await Subscription.findOne({ name });
    if (!subscription) {
      throw new NotFoundError();
    }
    subscription.set({ price, benefits });
    await subscription.save();
    res
      .status(200)
      .send({ message: 'Subscription updated', subscription: subscription });
  }
);

export { router as updateSubscriptionRouter };
