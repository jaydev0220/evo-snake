import cors from 'cors';
import express from 'express';
import helmet from 'helmet';

import router from './routes';

const app = express();

app.use(helmet());
app.use(
	cors({
		origin: process.env.CORS_ORIGIN ?? 'http://localhost:5173',
		methods: ['GET', 'POST'],
		allowedHeaders: ['Content-Type']
	})
);
app.use(express.json());

app.use('/v1', router);

export default app;
