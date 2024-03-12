import request from "supertest";
import { app } from "../../app";
import path from "path";
import { imageHandler } from "../../image-handler";

const IMAGE_FILE_PATH = path.join(__dirname, "profiletest.jpg");
const UPDATE_IMAGE_PATH = "/authentication/api/v1/auth/update-profile-image";

const USER_AGENT =
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.102 Safari/537.36";

it("updates user profile image", async () => {
  console.log("reached here");
  const { body, ...response } = await request(app)
    .patch(UPDATE_IMAGE_PATH)
    .set("Cookie", await signin())
    .attach("image", IMAGE_FILE_PATH)
    .expect(200);
  expect(body.data.user.profileImage).toBeDefined();
  expect(imageHandler.uploadFile).toHaveBeenCalled();
});
