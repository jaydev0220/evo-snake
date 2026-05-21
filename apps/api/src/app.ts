import cors from 'cors';
import express from 'express';
import { rateLimit } from 'express-rate-limit';
import helmet from 'helmet';

import { env } from './lib/schemas/env.js';
import { errorHandler, notFoundHandler } from './middlewares/errors.js';
import healthRouter from './routes/health.js';
import router from './routes/index.js';

const app = express();

if (env.TRUST_PROXY) {
	app.set('trust proxy', 1);
}

app.use(helmet());
app.use(
	cors({
		origin: env.CORS_ORIGIN,
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type']
	})
);
app.use(express.json({ limit: env.JSON_BODY_LIMIT }));

app.use('/health', healthRouter);

app.use(
	'/v1',
	rateLimit({
		windowMs: env.RATE_LIMIT_WINDOW_MS,
		limit: env.RATE_LIMIT_MAX,
		standardHeaders: 'draft-8',
		legacyHeaders: false,
		message: {
			error: {
				code: 'RATE_LIMITED',
				message: 'Too many requests, please try again later'
			}
		}
	}),
	router
);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
