import request from "supertest";
import { app } from "../../app";

const setUp = async () => {
  const { body: skillBody } = await request(app)
    .post("/api/artisans/skill")
    .set("Cookie", signin())
    .send({
      name: "React",
      description: "Javascript library",
    })
    .expect(201);
  const { body: catBody } = await request(app)
    .post("/api/artisans/services/category")
    .set("Cookie", signin())
    .send({
      name: "Technology",
      description: "Computers and gadgets",
    })
    .expect(201);
  const { body: subcatBody } = await request(app)
    .post("/api/artisans/services/subcategory")
    .set("Cookie", signin())
    .send({
      name: "Software Engineering",
      description: "Programming languages usage to solve problem",
      categoryId: catBody.category.id,
    })
    .expect(201);
  const { body: subcatBody2 } = await request(app)
    .post("/api/artisans/services/subcategory")
    .set("Cookie", signin())
    .send({
      name: "Computer Engineering",
      description: "Programming languages usage to solve problem",
      categoryId: catBody.category.id,
    })
    .expect(201);
  return { skillBody, subcatBody, subcatBody2 };
};
it("successfully creates an artisan", async () => {
  const { skillBody, subcatBody, subcatBody2 } = await setUp();

  const { body } = await request(app)
    .post("/api/artisans")
    .set("Cookie", signin())
    .send({
      businessName: "The Artisans",
      country: "Nigeria",
      latitude: "38.8951",
      longitude: "-77.0365",
      address: "Lagos, Ikeja",
      skills: [skillBody.skill.id],
      services: [subcatBody.subcategory.id, subcatBody2.subcategory.id],
      businessEmail: "devfelixphil@gmail.com",
    })
    .expect(201);
  console.log(body);
  expect(body.artisan.services.length).toEqual(2);
});
