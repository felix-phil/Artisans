import express from "express";
import "express-async-errors";
import { json } from "body-parser";
import cookieSesion from "cookie-session";

import { errorHandler, NotFoundError } from "@theartisans/shared/build";

import { signUpRouter } from "./routes/signup";
import { signInRouter } from "./routes/signin";
import { resendRouter } from "./routes/resend-otp";
import { verifyRouter } from "./routes/verify";
import { requestPasswordResetRouter } from "./routes/request-reset-password";
import { resetPasswordRouter } from "./routes/reset-password";
import { currentUserRouter } from "./routes/current-user";
import { changePasswordRouter } from "./routes/change-password";
import { updateRouter } from "./routes/update";
import { updateProfileImageRouter } from "./routes/update-priofile-image";
import { signOutRouter } from "./routes/signout";
import { revalidateRouter } from "./routes/revalidate-session";

const app = express();
app.set("trust proxy", true);

app.use(json());
app.use(
  cookieSesion({
    signed: false,
    secure: process.env.NODE_ENV !== "test",
  })
);
app.use("/authentication", signUpRouter);
app.use("/authentication", signInRouter);
app.use("/authentication", resendRouter);
app.use("/authentication", verifyRouter);
app.use("/authentication", requestPasswordResetRouter);
app.use("/authentication", resetPasswordRouter);
app.use("/authentication", currentUserRouter);
app.use("/authentication", changePasswordRouter);
app.use("/authentication", updateRouter);
app.use("/authentication", updateProfileImageRouter);
app.use("/authentication", signOutRouter);
app.use("/authentication", revalidateRouter);

app.get("/", (req, res) => {
  res.status(200).send({
    serviceName: process.env.NATS_CLIENT_ID,
    status: "working!",
  });
});

// app.all("*", async (req, res, next) => {
//   console.log(req);
//   throw new NotFoundError(`Route ${req.url} cannot be found`);
// });
app.use(errorHandler);

export { app };
