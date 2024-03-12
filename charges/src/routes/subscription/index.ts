import express, { Request, Response } from 'express';
import { Subscription } from '../../models/subscriptions';

const router = express.Router();

router.get('/api/charges/subscription', async (req: Request, res: Response) => {
  const subscriptions = await Subscription.find({});
  res.status(200).send(subscriptions);
});

export { router as indexSubscriptionRouter };
