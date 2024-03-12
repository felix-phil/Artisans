import request from 'supertest';
import { app } from '../../../app';
jest.setTimeout(60000);

it('requires card auth mode to charge', async () => {
  const { body } = await request(app)
    .post(`/api/billing/charge`)
    .set('Cookie', signin())
    .send({
      cardNumber: '5531886652142950',
      cardExpiryMonth: '09',
      cardExpiryYear: '32',
      cardCvv: '564',
      cardFullName: 'Felix Philips',
      chargeType: 'NONE',
    })
    .expect(200);
  expect(body.authRequired).toEqual(true);
  expect(body.completed).toEqual(false);
  expect(body.authMode).toEqual('pin');
});
it('requires card auth mode to charge', async () => {
  const { body } = await request(app)
    .post(`/api/billing/charge`)
    .set('Cookie', signin())
    .send({
      cardNumber: '5438898014560229',
      cardExpiryMonth: '10',
      cardExpiryYear: '31',
      cardCvv: '564',
      cardFullName: 'Felix Philips',
      chargeType: 'NONE',
    })
    .expect(200);
  // console.log(body);
  expect(body.authRequired).toEqual(true);
  expect(body.completed).toEqual(false);
  expect(body.authMode).toEqual('redirect');
  expect(body.redirect_uri).toBeDefined();
});

it('requires card auth mode to be avs_noauth', async () => {
  const { body } = await request(app)
    .post(`/api/billing/charge`)
    .set('Cookie', signin())
    .send({
      cardNumber: '4556052704172643',
      cardExpiryMonth: '09',
      cardExpiryYear: '32',
      cardCvv: '899',
      cardFullName: 'Felix Philips',
      chargeType: 'NONE',
    })
    .expect(200);
  // console.log(body);
  expect(body.authRequired).toEqual(true);
  expect(body.completed).toEqual(false);
  expect(body.authMode).toEqual('avs_noauth');
});
it('charges with auth data avs_noauth', async () => {
  const requestAuthmode = await request(app)
    .post(`/api/billing/charge`)
    .set('Cookie', signin())
    .send({
      cardNumber: '4556052704172643',
      cardExpiryMonth: '09',
      cardExpiryYear: '32',
      cardCvv: '899',
      cardFullName: 'Felix Philips',
      chargeType: 'NONE',
    })
    .expect(200);
  const chargeWithAuth = await request(app)
    .post(`/api/billing/charge`)
    .set('Cookie', signin())
    .send({
      cardNumber: '4556052704172643',
      cardExpiryMonth: '09',
      cardExpiryYear: '32',
      cardCvv: '899',
      cardFullName: 'Felix Philips',
      chargeType: 'AUTH',
      authMode: requestAuthmode.body.authMode,
      authFields: requestAuthmode.body.authFields,
      authFieldValues: {
        city: 'San Francisco',
        address: '69 Fremont Street',
        state: 'CA',
        country: 'US',
        zipcode: '94105',
      },
    })
    .expect(200);
  // console.log(chargeWithAuth.body);
  expect(chargeWithAuth.body.validationRequired).toEqual(true);
  expect(chargeWithAuth.body.validationMode).toEqual('redirect');
  expect(chargeWithAuth.body.redirect_uri).toBeDefined();
});
it('charges with auth data pin', async () => {
  const requestAuthmode = await request(app)
    .post(`/api/billing/charge`)
    .set('Cookie', signin())
    .send({
      cardNumber: '5531886652142950',
      cardExpiryMonth: '09',
      cardExpiryYear: '32',
      cardCvv: '564',
      cardFullName: 'Felix Philips',
      chargeType: 'NONE',
    })
    .expect(200);
  const chargeWithAuth = await request(app)
    .post(`/api/billing/charge`)
    .set('Cookie', signin())
    .send({
      cardNumber: '5531886652142950',
      cardExpiryMonth: '09',
      cardExpiryYear: '32',
      cardCvv: '564',
      cardFullName: 'Felix Philips',
      chargeType: 'AUTH',
      authMode: requestAuthmode.body.authMode,
      authFields: requestAuthmode.body.authFields,
      authFieldValues: { pin: '3310' },
    })
    .expect(200);
  // console.log(chargeWithAuth.body);
  expect(chargeWithAuth.body.validationRequired).toEqual(true);
  expect(chargeWithAuth.body.validationMode).toEqual('otp');
});
