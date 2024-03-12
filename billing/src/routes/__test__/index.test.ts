import request from 'supertest';
import { app } from '../../app';
import mongoose from 'mongoose';
import { Billing } from '../../models/billing';
import { natsWrapper } from '../../nats-wrapper';

it('returns empty billing', async () => {
  const { body } = await request(app)
    .get(`/api/billing`)
    .set('Cookie', signin(false, new mongoose.Types.ObjectId().toHexString()))
    .send()
    .expect(200);
  expect(body.length).toEqual(0);
});

it('returns empty billing', async () => {
  const userId = new mongoose.Types.ObjectId().toHexString();
  const billing1 = Billing.build({
    userId: userId,
    cardNumber: '5531886652142950',
    cardFullName: 'Felix Philips',
    cardExpiryMonth: '09',
    cardExpiryYear: '32',
    flwRef: 'FLW_MOCKakdnksfsak324qewfpos',
  });
  await billing1.save();

  const billing2 = Billing.build({
    userId: userId,
    cardNumber: '5531886652142950',
    cardFullName: 'Felix Philips',
    cardExpiryMonth: '09',
    cardExpiryYear: '32',
    flwRef: 'FLW_MOCKakdnksfsak324qewfpos',
    cardToken: 'flw_mockedklasfhasd',
  });
  billing2.set({ completed: true });
  await billing2.save();

  const { body } = await request(app)
    .get(`/api/billing`)
    .set('Cookie', signin(false, userId))
    .send()
    .expect(200);
  expect(body.length).toEqual(2);
});
