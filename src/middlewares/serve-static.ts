import { join } from 'path';

import { Router } from '../router';

export const serveStatic = (staticDir: string): Router => {
	return new Router()
		.get('*', async (req, res) => {
			const fullPath = join(staticDir, req.path);
			await res.status(200).sendFile(fullPath);
		})
		.use('*', async (_req, res) => {
			await res.status(405).end();
		});
};
