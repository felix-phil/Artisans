import request from "supertest";
import { app } from "../../../app";

it("creates a service category", async () => {
  const { body } = await request(app)
    .post("/api/artisans/services/category")
    .set("Cookie", signin())
    .send({
      name: "Technology",
      description: "Computers and gadgets",
    })
    .expect(201);
  expect(body.category.name).toEqual("technology");
});
