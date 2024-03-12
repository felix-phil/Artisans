import express, { Request, Response } from 'express';
import {
  NotAuthorizedError,
  NotFoundError,
  requireAuth,
  validateRequest,
} from '@theartisans/shared/build';
import { Billing } from '../models/billing';
import { param } from 'express-validator';
import { BillingDeletedPubliher } from '../events/publisher/billing-deleted-publisher';
import { natsWrapper } from '../nats-wrapper';

const router = express.Router();

router.delete(
  '/api/billing/:billingId',
  requireAuth,
  [param('billingId').isMongoId().withMessage('A valid id is required')],
  validateRequest,
  async (req: Request, res: Response) => {
    const billingId = req.params.billingId;
    const billing = await Billing.findById(billingId);
    if (!billing) {
      throw new NotFoundError();
    }
    if (billing.userId !== req.currentUser!.id) {
      throw new NotAuthorizedError();
    }
    if (billing.completed) {
      new BillingDeletedPubliher(natsWrapper.client).publish({
        id: billing.id,
        userId: billing.userId,
        email: req.currentUser!.email,
      });
    }
    await billing.deleteOne();
    res.status(200).send({ message: 'Billing deleted' });
  }
);
export { router as deleteBillingRouter };
