import request from 'supertest';
import { app } from '../../../app';

it('gets all available subscriptions', async () => {
  await request(app)
    .post('/api/charges/subscription')
    .set('Cookie', signin())
    .send({
      name: 'PREMIUM',
      benefits: ['It is okay', 'It is okay'],
      price: 50,
    })
    .expect(201);
  await request(app)
    .post('/api/charges/subscription')
    .set('Cookie', signin())
    .send({
      name: 'PRO',
      benefits: ['It is okay', 'It is okay'],
      price: 50,
    })
    .expect(201);
  const { body } = await request(app)
    .get('/api/charges/subscription')
    .expect(200);
  expect(body.length).toEqual(2);
});
