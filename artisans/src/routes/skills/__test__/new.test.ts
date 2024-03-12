import request from "supertest";
import { app } from "../../../app";

it("Successfully creates a skill", async () => {
  const { body } = await await request(app)
    .post("/api/artisans/skill")
    .set("Cookie", signin())
    .send({
      name: "React",
      description: "Javascript library",
    })
    .expect(201);
});
