import request from "supertest";
import { app } from "../../app";
import { natsWrapper } from "../../nats-wrapper";

const CHANGE_PASSWORD_PATH = "/authentication/api/v1/auth/change-password";

it("returns not authorized as cookie is not set", async () => {
  await request(app).patch(CHANGE_PASSWORD_PATH).send({}).expect(401);
});
it("returns changes user password", async () => {
  await request(app)
    .patch(CHANGE_PASSWORD_PATH)
    .set("Cookie", await signin())
    .send({
      currentPassword: "$DEVphil2000", // password used in signin function
      newPassword: "$DEVphil2002",
      confirmNewPassword: "$DEVphil2002",
    })
    .expect(200);
  expect(natsWrapper.client.publish).toHaveBeenCalledTimes(2);
});
