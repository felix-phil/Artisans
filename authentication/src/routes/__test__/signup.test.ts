import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const SIGNUP_PATH = "/authentication/api/v1/auth/signup";
const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

it("returns 400 as params are not defined", async () => {
  await request(app).post(SIGNUP_PATH).send({}).expect(400);
});
it("returns 400 if user-agent is not set", async () => {
  await request(app)
    .post(SIGNUP_PATH)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(400);
});
it("makes sure password is strong", async () => {
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "notaccepted",
    })
    .expect(400);
});
it("returns 400 if user already exists", async () => {
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);

  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(400);
});

it("successfully creates a user", async () => {
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);
});

it("sends email signup otp", async () => {
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);

  expect(natsWrapper.client.publish).toHaveBeenCalled();
});
