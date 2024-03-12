import request from 'supertest';
import { app } from '../../../app';

it('requires user authentication', async () => {
  await request(app).post('/api/charges/subscription').send({}).expect(401);
});
it('requires user roles to have more than normal', async () => {
  await request(app)
    .post('/api/charges/subscription')
    .set('Cookie', signin(false))
    .send({})
    .expect(401);
});

it('needs name to be one of subscription type enum', async () => {
  await request(app)
    .post('/api/charges/subscription')
    .set('Cookie', signin())
    .send({
      name: 'NOTACCEPTED',
      benefits: ['It is okay', 'It is okay'],
      price: 50,
    })
    .expect(400);
});
it('successfully creates a subscription', async () => {
  await request(app)
    .post('/api/charges/subscription')
    .set('Cookie', signin())
    .send({
      name: 'PREMIUM',
      benefits: ['It is okay', 'It is okay'],
      price: 50,
    })
    .expect(201);
});
it("doesn't allow two subscription with same name", async () => {
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
      name: 'PREMIUM',
      benefits: ['It is okay', 'It is okay'],
      price: 50,
    })
    .expect(400);
});
