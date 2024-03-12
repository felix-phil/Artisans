import express from 'express';
import 'express-async-errors';
import { json, urlencoded } from 'body-parser';
import cookieSesion from 'cookie-session';

import {
  errorHandler,
  NotFoundError,
  currentUser,
} from '@theartisans/shared/build';

import { chargeBillingRouter } from './routes/new/charge';
import { validateBillingRouter } from './routes/new/validate';
import { deleteBillingRouter } from './routes/delete';
import { indexBillingsRouter } from './routes';
import { redirectBillingRouter } from './routes/new/redirect';

const app = express();
app.set('trust proxy', true);
app.use(urlencoded({ extended: true }));
app.use(json());
app.use(
  cookieSesion({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  })
);

app.use(currentUser);

app.use(chargeBillingRouter);
app.use(validateBillingRouter);
app.use(deleteBillingRouter);
app.use(indexBillingsRouter);
app.use(redirectBillingRouter);

app.all('*', async (req, res, next) => {
  throw new NotFoundError();
});
app.use(errorHandler);

export { app };
