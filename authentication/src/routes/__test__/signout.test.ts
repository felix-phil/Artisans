import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const VERIFY_PATH = "/authentication/api/v1/auth/verify";
const SIGNUP_PATH = "/authentication/api/v1/auth/signup";
const SIGNOUT_PATH = "/authentication/api/v1/auth/signout";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

it("clears cookies after signing out", async () => {
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
  await request(app)
    .post(VERIFY_PATH)
    .send({ email: "devfelixphil@gmail.com", otp: signupEventData.otp })
    .expect(200);

  const res = await request(app).post(SIGNOUT_PATH).send({}).expect(200);

  expect(res.get("Set-Cookie")[0]).toEqual(
    "session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; httponly"
  );
});
