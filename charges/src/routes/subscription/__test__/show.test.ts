import request from 'supertest';
import { app } from '../../../app';

it("returns 404 as subscription doesn't exist", async () => {
  await request(app).get('/api/charges/subscription/PREMIUM').expect(404);
});
it('needs a valid subscription type', async () => {
  await request(app).get('/api/charges/subscription/NOTACCEPTED').expect(400);
});
it('gets the subscription detail', async () => {
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
    .get('/api/charges/subscription/PREMIUM')
    .expect(200);
  expect(body.benefits.length).toEqual(2);
});
