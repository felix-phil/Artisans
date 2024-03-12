import request from "supertest";
import { app } from "../../../app";

it("creates service subcategory successfully", async () => {
  const { body: catBody } = await request(app)
    .post("/api/artisans/services/category")
    .set("Cookie", signin())
    .send({
      name: "Technology",
      description: "Computers and gadgets",
    })
    .expect(201);
  const { body } = await request(app)
    .post("/api/artisans/services/subcategory")
    .set("Cookie", signin())
    .send({
      name: "Software Engineering",
      description: "Programming languages usage to solve problem",
      categoryId: catBody.category.id,
    })
    .expect(201);
});
