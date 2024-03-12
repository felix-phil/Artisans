import request from 'supertest';
import { app } from '../../../app';

it('returns 404 if subscription does not exist', async () => {
  await request(app)
    .put('/api/charges/subscription/PREMIUM')
    .set('Cookie', signin())
    .send({
      benefits: ['It is okay', 'It is okay', 'Now very much okay'],
      price: 60,
    })
    .expect(404);
});
it('successfully updates a subscription', async () => {
  await request(app)
    .post('/api/charges/subscription')
    .set('Cookie', signin())
    .send({
      name: 'PREMIUM',
      benefits: ['It is okay', 'It is okay'],
      price: 50,
    })
    .expect(201);
  const { body } = await request(app)
    .put('/api/charges/subscription/PREMIUM')
    .set('Cookie', signin())
    .send({
      benefits: ['It is okay', 'It is okay', 'Now very much okay'],
      price: 60,
    })
    .expect(200);
  expect(body.subscription.benefits.length).toEqual(3);
  expect(body.subscription.price).toEqual(60);
});
