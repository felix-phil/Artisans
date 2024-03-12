import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const RESET_PATH = "/authentication/api/v1/auth/reset";
const REQUEST_PATH = "/authentication/api/v1/auth/request-reset";
const SIGNUP_PATH = "/authentication/api/v1/auth/signup";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

it("returns 400 as body is empty", async () => {
  await request(app).post(RESET_PATH).send({}).expect(400);
});

it("resets user password", async () => {
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);

  const resetRequestData = await request(app)
    .post(REQUEST_PATH)
    .send({ email: "devfelixphil@gmail.com" })
    .expect(200);

  const { otp } = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[1][1] // second publish call in this test: signup calls first
  );
  await request(app)
    .post(RESET_PATH)
    .send({
      resetToken: resetRequestData.body.resetToken,
      otp: otp,
      newPassword: "$DEVphil2001",
      confirmNewPassword: "$DEVphil2001",
    })
    .expect(200);
  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(3);
});
