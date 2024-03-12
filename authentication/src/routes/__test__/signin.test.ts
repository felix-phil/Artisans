import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const VERIFY_PATH = "/authentication/api/v1/auth/verify";
const SIGNUP_PATH = "/authentication/api/v1/auth/signup";
const SIGNIN_PATH = "/authentication/api/v1/auth/signin";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";
const USER_AGENT2 =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Firefox/98.0.4758.102 Safari/537.36";

it("returns 400 if login credentials are empty ", async () => {
  await request(app).post(SIGNIN_PATH).send({}).expect(400);
});
it("returns 400 if login credentials does not exist", async () => {
  await request(app)
    .post(SIGNIN_PATH)
    .set("User-Agent", USER_AGENT)
    .send({ email: "devfelixphil@gmail.com", password: "$DEVphil2000" })
    .expect(400);
});
it("sends otp to user if device is not recognized", async () => {
  // Signup
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);
  // Verify Email
  const signupEventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  await request(app)
    .post(VERIFY_PATH)
    .send({ email: "devfelixphil@gmail.com", otp: signupEventData.otp })
    .expect(200);
  // sign in
  const signinData = await request(app)
    .post(SIGNIN_PATH)
    .set("User-Agent", USER_AGENT2)
    .send({ email: "devfelixphil@gmail.com", password: "$DEVphil2000" })
    .expect(200);
  expect(signinData.body.data.otpSent).toEqual(true);
  expect(natsWrapper.client.publish).toHaveBeenCalled();
});

it("succesfully signs in user on user signin with same sign up device", async () => {
  // Signup
  await request(app)
    .post(SIGNUP_PATH)
    .set("User-Agent", USER_AGENT)
    .send({
      email: "devfelixphil@gmail.com",
      password: "$DEVphil2000",
    })
    .expect(201);
  // Verify Email
  const signupEventData = JSON.parse(
    (natsWrapper.client.publish as jest.Mock).mock.calls[0][1]
  );
  await request(app)
    .post(VERIFY_PATH)
    .send({ email: "devfelixphil@gmail.com", otp: signupEventData.otp })
    .expect(200);
  // sign in
  const signinData = await request(app)
    .post(SIGNIN_PATH)
    .set("User-Agent", USER_AGENT)
    .send({ email: "devfelixphil@gmail.com", password: "$DEVphil2000" })
    .expect(200);
  expect(signinData.body.data.otpSent).toEqual(false);
});
