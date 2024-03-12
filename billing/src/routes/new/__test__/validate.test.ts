import request from 'supertest';
import { app } from '../../../app';
import { natsWrapper } from '../../../nats-wrapper';
jest.setTimeout(60000);

it('requires OTP for card validation', async () => {
  await request(app)
    .post(`/api/billing/validate`)
    .set('Cookie', signin())
    .send({})
    .expect(400);
});

it('returns payment completed successfully', async () => {
  const user = signin();
  await request(app) // charging with auth on card that requires pin
    .post(`/api/billing/charge`)
    .set('Cookie', user)
    .send({
      cardNumber: '5531886652142950',
      cardExpiryMonth: '09',
      cardExpiryYear: '32',
      cardCvv: '564',
      cardFullName: 'Felix Philips',
      chargeType: 'AUTH',
      authMode: 'pin',
      authFields: ['pin'],
      authFieldValues: { pin: '3310' },
    })
    .expect(200);
  const response = await request(app)
    .post(`/api/billing/validate`)
    .set('Cookie', user)
    .send({ otp: '12345' })
    .expect(200);
  expect(response.body.completed).toEqual(true);
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
