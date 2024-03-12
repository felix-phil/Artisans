import express from "express";
import "express-async-errors";
import { json, urlencoded } from "body-parser";
import cookieSesion from "cookie-session";

import {
  errorHandler,
  NotFoundError,
  currentUser,
} from "@theartisans/shared/build";

import { newSkillRouter } from "./routes/skills/new";
import { newServiceCategoryRouter } from "./routes/services/new-category";
import { newServiceSubcategoryRouter } from "./routes/services/new-subcategory";
import { newArtisanRouter } from "./routes/new";
import { updateLogoRouter } from "./routes/update-logo";
import { updateArtisanRouter } from "./routes/update";

const app = express();
app.set("trust proxy", true);
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(
  cookieSesion({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);

app.use(currentUser);

app.use(newArtisanRouter);
app.use(newSkillRouter);
app.use(newServiceCategoryRouter);
app.use(newServiceSubcategoryRouter);
app.use(updateLogoRouter);
app.use(updateArtisanRouter);

app.all("*", async (req, res, next) => {
  throw new NotFoundError();
});
app.use(errorHandler);

export { app };
