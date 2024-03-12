import express, { Request, Response } from 'express';
import { Subscription } from '../../models/subscriptions';
import {
  requireAuth,
  requireUserRole,
  UserRoles,
  validateRequest,
  SubscriptionType,
  BadRequestError,
} from '@theartisans/shared/build';
import { body } from 'express-validator';

const router = express.Router();

const requireRole = requireUserRole([
  UserRoles.Admin,
  UserRoles.Moderator,
  UserRoles.Developer,
]);
router.post(
  '/api/charges/subscription',
  requireAuth,
  requireRole,
  [
    body('name')
      .notEmpty()
      .isIn(Object.values(SubscriptionType))
      .withMessage(Object.values(SubscriptionType).join(', ') + 'are allowed'),
    body('price').isFloat({ gt: 0 }).withMessage('Price is required'),
    body('benefits').isArray().withMessage('Benefits is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const { name, price, benefits } = req.body;
    const subscriptionExists = await Subscription.findOne({ name: name });
    if (subscriptionExists) {
      throw new BadRequestError(
        `A subscription with name: ${name} already exists`
      );
    }

    const subscription = Subscription.build({
      name,
      price,
      benefits,
    });
    await subscription.save();
    res
      .status(201)
      .send({ message: 'Subscription created', subscription: subscription });
  }
);

export { router as newSubscriptionRouter };
