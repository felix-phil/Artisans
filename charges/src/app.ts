import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSesion from 'cookie-session';

import {
  errorHandler,
  NotFoundError,
  currentUser,
} from '@theartisans/shared/build';
import { newSubscriptionRouter } from './routes/subscription/new';
import { indexSubscriptionRouter } from './routes/subscription';
import { showSubscriptionRouter } from './routes/subscription/show';
import { updateSubscriptionRouter } from './routes/subscription/update';
import { newSubscriptionPaymentRouter } from './routes/payments/subscription/new';

const app = express();
app.set('trust proxy', true);

app.use(json());
app.use(
  cookieSesion({
    signed: false,
    secure: process.env.NODE_ENV !== 'test',
  })
);

app.use(currentUser);

app.use(newSubscriptionRouter);
app.use(indexSubscriptionRouter);
app.use(showSubscriptionRouter);
app.use(updateSubscriptionRouter);
app.use(newSubscriptionPaymentRouter);

app.all('*', async (req, res, next) => {
  throw new NotFoundError();
});
app.use(errorHandler);

export { app };
