import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const CURRENT_USER_PATH = "/authentication/api/v1/auth/current-user";

it("returns currentUser as null as no cookie is attached to request", async () => {
  const response = await request(app).get(CURRENT_USER_PATH).expect(200);
  expect(response.body.data.currentUser).toBeNull();
});
it("returns current user", async () => {
  const { body } = await request(app)
    .get(CURRENT_USER_PATH)
    .set("Cookie", await signin())
    .expect(200);
  expect(body.data.currentUser).toBeDefined();
});
