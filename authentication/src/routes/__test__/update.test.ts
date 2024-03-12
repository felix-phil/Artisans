import request from "supertest";
import { app } from "../../app";

const UPDATE_PATH = "/authentication/api/v1/auth/update";

it("updates user profile", async () => {
  const { body } = await request(app)
    .patch(UPDATE_PATH)
    .set("Cookie", await signin())
    .send({
      firstName: "Felix",
      lastName: "Philips",
      location: "dummy location",
    })
    .expect(200);
  expect(body.data.user.firstName).toEqual("Felix");
  expect(body.data.user.lastName).toEqual("Philips");
  expect(body.data.user.location).toEqual("dummy location");
});
