import type { NextFunction, Request, Response } from 'express';

export class AppError extends Error {
	constructor(
		message: string,
		public readonly statusCode = 500,
		public readonly code = 'INTERNAL_SERVER_ERROR'
	) {
		super(message);
	}
}

export function notFoundHandler(req: Request, _res: Response, next: NextFunction): void {
	next(new AppError(`Route ${req.method} ${req.path} not found`, 404, 'NOT_FOUND'));
}

export function errorHandler(
	error: unknown,
	_req: Request,
	res: Response,
	next: NextFunction
): void {
	if (res.headersSent) {
		next(error);
		return;
	}

	const appError = error instanceof AppError ? error : null;
	const statusCode = appError?.statusCode ?? 500;
	const code = appError?.code ?? 'INTERNAL_SERVER_ERROR';
	const message = appError?.message ?? 'Internal server error';

	res.status(statusCode).json({
		error: {
			code,
			message
		}
	});
}
