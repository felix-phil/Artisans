import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const RESEND_PATH = "/authentication/api/v1/auth/resend";
const REQUEST_PATH = "/authentication/api/v1/auth/request-reset";
const SIGNUP_PATH = "/authentication/api/v1/auth/signup";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

it("returns 400 as body is empty", async () => {
  await request(app).post(RESEND_PATH).send({}).expect(400);
});
it("returns 400 if type parameter is not known", async () => {
  // Accepted types: signup, signin, password
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);

  await request(app)
    .post(RESEND_PATH)
    .send({ email: "devfelixphil@gmail.com", type: "login" })
    .expect(400);
});
it("resends otp", async () => {
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);

  await request(app)
    .post(RESEND_PATH)
    .send({ email: "devfelixphil@gmail.com", type: "signup" })
    .expect(200);
  await request(app)
    .post(RESEND_PATH)
    .send({ email: "devfelixphil@gmail.com", type: "signin" })
    .expect(200);
  await request(app)
    .post(RESEND_PATH)
    .send({ email: "devfelixphil@gmail.com", type: "password" })
    .expect(200);

  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(4);
});
