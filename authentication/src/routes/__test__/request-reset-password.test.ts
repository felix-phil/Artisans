import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const REQUEST_PATH = "/authentication/api/v1/auth/request-reset";
const SIGNUP_PATH = "/authentication/api/v1/auth/signup";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

it("returns 400 as body is empty", async () => {
  await request(app).post(REQUEST_PATH).send({}).expect(400);
});

it("returns 404 if user does not exist", async () => {
  await request(app)
    .post(REQUEST_PATH)
    .send({ email: "devfelixphil@gmail.com" })
    .expect(404);
});

it("sends reset password event mail", async () => {
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);
  const signupEventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  const data = await request(app)
    .post(REQUEST_PATH)
    .send({ email: "devfelixphil@gmail.com" })
    .expect(200);
  expect(data.body.data.resetToken).toBeDefined();
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
