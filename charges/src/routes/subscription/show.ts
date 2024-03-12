import {
  NotFoundError,
  SubscriptionType,
  validateRequest,
} from '@theartisans/shared/build';
import express, { Request, Response } from 'express';
import { param } from 'express-validator';
import { Subscription } from '../../models/subscriptions';

const router = express.Router();

router.get(
  '/api/charges/subscription/:name',
  [
    param('name')
      .isIn(Object.values(SubscriptionType))
      .withMessage('valid subscription param name is required'),
  ],
  validateRequest,
  async (req: Request, res: Response) => {
    const name = req.params.name;
    const subscription = await Subscription.findOne({ name });
    if (!subscription) {
      throw new NotFoundError();
    }
    res.status(200).send(subscription);
  }
);

export { router as showSubscriptionRouter };
