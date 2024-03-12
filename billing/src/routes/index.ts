import express, { Request, Response } from 'express';
import { UserRoles, requireAuth } from '@theartisans/shared/build';
import { Billing } from '../models/billing';

const router = express.Router();

router.get('/api/billing', requireAuth, async (req: Request, res: Response) => {
  const billings = await Billing.find({ userId: req.currentUser!.id });
  res.status(200).send(billings);
});

export { router as indexBillingsRouter };
