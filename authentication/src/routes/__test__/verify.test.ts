import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const VERIFY_PATH = "/authentication/api/v1/auth/verify";
const SIGNUP_PATH = "/authentication/api/v1/auth/signup";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

it("returns 400 as body is empty", async () => {
  await request(app).post(VERIFY_PATH).send({}).expect(400);
});

it("succesfully signs in user on user signup verification", async () => {
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
    .post(VERIFY_PATH)
    .send({ email: "devfelixphil@gmail.com", otp: signupEventData.otp })
    .expect(200);
  expect(data.get("Set-Cookie")).toBeDefined();
  expect(data.body.data.user.email).toEqual(signupEventData.email);
  expect(data.body.data.user.active).toEqual(true);
});
