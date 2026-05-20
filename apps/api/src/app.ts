import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import { env } from './lib/schemas/env';
import router from './routes';

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: env.CORS_ORIGIN,
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type']
	})
);
app.use(express.json());

app.use('/v1', router);

export default app;
