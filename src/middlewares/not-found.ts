import { RequestHandler } from '../types/request-handler';

export const notFound: RequestHandler = async (_req, res, next) => {
	await res.status(404).end();
	next();
};
