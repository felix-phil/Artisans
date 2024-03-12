import { PositiveResponseBody } from "@theartisans/shared/build";
import express, { Request, Response, Router } from "express";

const router: Router = express.Router();

router.post(
  "/api/v1/auth/signout",
  (req: Request, res: Response<PositiveResponseBody<any>>) => {
    req.session = null;
    res.send({
      statusCode: 200,
      data: {},
      message: "Log out success",
    });
  }
);

export { router as signOutRouter };
