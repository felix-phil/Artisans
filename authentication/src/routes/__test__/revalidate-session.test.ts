import request from "supertest";
import { app } from "../../app";

const REVALIDATE_PATH = "/authentication/api/v1/auth/revalidate";

it("returns 200 revalidates and extends user session", async () => {
  const cookie = await signin();
  const { body } = await request(app)
    .post(REVALIDATE_PATH)
    .set("Cookie", cookie)
    .expect(200);
  expect(body.data.user.email).toBeDefined();
});
