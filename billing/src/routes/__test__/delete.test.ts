import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { Billing } from '../../models/billing';
import { natsWrapper } from '../../nats-wrapper';

it('returns 404 as no billing exists', async () => {
  await request(app)
    .delete(`/api/billing/${new mongoose.Types.ObjectId().toHexString()}`)
    .set('Cookie', signin())
    .send()
    .expect(404);
});

it('deletes the billing detail', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const billing = Billing.build({
    userId,
    cardNumber: '5531886652142950',
    cardFullName: 'Felix Philips',
    cardExpiryMonth: '09',
    cardExpiryYear: '32',
    flwRef: 'FLW_MOCKakdnksfsak324qewfpos',
  });
  await billing.save();
  await request(app)
    .delete(`/api/billing/${billing.id}`)
    .set('Cookie', signin(false, userId))
    .send()
    .expect(200);
  expect(natsWrapper.client.publish).not.toHaveBeenCalled();
  // assert no billing in database
  const afterDeleteBilling = await Billing.find({});
  expect(afterDeleteBilling.length).toEqual(0);
});
it('deletes the billing detail and publishes event', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();

  const billing = Billing.build({
    userId,
    cardNumber: '5531886652142950',
    cardFullName: 'Felix Philips',
    cardExpiryMonth: '09',
    cardExpiryYear: '32',
    flwRef: 'FLW_MOCKakdnksfsak324qewfpos',
    cardToken: 'flw_mockedklasfhasd',
  });
  billing.set({ completed: true });
  await billing.save();
  await request(app)
    .delete(`/api/billing/${billing.id}`)
    .set('Cookie', signin(false, userId))
    .send()
    .expect(200);
  expect(natsWrapper.client.publish).toHaveBeenCalled();
  const afterDeleteBilling = await Billing.find({});
  expect(afterDeleteBilling.length).toEqual(0);
});
