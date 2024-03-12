import mongoose from "mongoose";
import request from "supertest";
import { app } from "../../app";

const setUp = async () => {
  const userId = await new mongoose.Types.ObjectId().toHexString();
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
  const { body: artisanBody } = await request(app)
    .post("/api/artisans")
    .set("Cookie", signin(false, userId))
    .send({
      businessName: "The Artisans",
      country: "Nigeria",
      latitude: "38.8951",
      longitude: "-77.0365",
      address: "Lagos, Ikeja",
      skills: [skillBody.skill.id],
      services: [subcatBody.subcategory.id],
      businessEmail: "devfelixphil@gmail.com",
    })
    .expect(201);

  return { userId, subcatBody, artisanBody, subcatBody2, skillBody };
};
it("successfully updates artisan profile", async () => {
  const { userId, skillBody, subcatBody, subcatBody2, artisanBody } =
    await setUp();
  const { body } = await request(app)
    .put("/api/artisans/" + artisanBody.artisan.id)
    .set("Cookie", signin(false, userId))
    .send({
      businessName: "The Artisans",
      country: "Nigeria",
      latitude: "38.8951",
      longitude: "-77.0365",
      address: "Kwara, Ilorin",
      skills: [skillBody.skill.id],
      services: [subcatBody.subcategory.id, subcatBody2.subcategory.id],
      businessEmail: "devfelixphil@gmail.com",
      website: "https://theartisans.com",
      linkedin: "https://linkedin.com/felix-42343",
    })
    .expect(200);
  console.log(body);
  //   expect(body.artisan.businessLogoUrl).toBeDefined();
});
