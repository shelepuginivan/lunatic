import { join } from 'path';

import { RequestHandler } from '../types/request-handler';

export const serveStatic = (staticDir: string): RequestHandler =>
	async (req, res, next) => {
		if (
			req.method !== 'GET' &&
			req.method !== 'HEAD' &&
			req.method !== 'OPTIONS'
		) {
			await res.status(405).end();
			return next();
		}

		const relativePath = req.path.replace(/\/[^/]*/, '');
		const fullPath = join(staticDir, relativePath);

		await res.status(200).send(fullPath);

		next();
	};
