import express from 'express';
import 'express-async-errors';
import { json } from 'body-parser';
import cookieSesion from 'cookie-session';

import {
  errorHandler,
  NotFoundError,
  currentUser,
} from '@theartisans/shared/build';
import { newSubscriptionRouter } from './routes/new';
import { indexSubscriptionRouter } from './routes';
import { showSubscriptionRouter } from './routes/show';
import { updateSubscriptionRouter } from './routes/update';

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

app.all('*', async (req, res, next) => {
  throw new NotFoundError();
});
app.use(errorHandler);

export { app };
