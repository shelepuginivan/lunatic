import { createHash } from 'crypto';
import { existsSync } from 'fs';
import { stat } from 'fs/promises';
import { join, sep } from 'path';

import { Router } from '../router';

export interface ServeStaticOptions {
	dotfiles?: 'allow' | 'forbid' | 'ignore'
	etag?: boolean
	index?: string | false
	lastModified?: boolean
}

export const serveStatic = (staticDir: string, options?: ServeStaticOptions): Router => {
	options = options ?? {
		dotfiles: 'ignore',
		etag: true,
		index: 'index.html',
		lastModified: true
	};

	const { dotfiles, etag, index, lastModified } = options;

	return new Router()
		.get('*', async (req, res, next) => {
			let fullPath = join(staticDir, req.path);

			if (
				dotfiles !== 'allow' &&
				fullPath.split(sep).some((part) => part.startsWith('.'))
			) {
				const status = dotfiles === 'ignore'
					? 404
					: 403;

				await res.status(status).end();
				return next();
			}

			const stats = existsSync(fullPath) && await stat(fullPath);

			if (!stats) {
				await res.status(404).end();
				return next();
			}

			if (stats.isDirectory()) {
				if (index) {
					const pathToIndex = join(fullPath, index);

					if (existsSync(pathToIndex)) {
						fullPath = pathToIndex;
					}
				} else {
					await res.status(404).end();
					return next();
				}
			}

			if (lastModified) {
				res.setHeader('Last-Modified', stats.mtime.toUTCString());
			}

			if (etag) {
				const hash = createHash('md5');
				hash.update(stats.mtime.toUTCString());
				const etagValue = `"${hash.digest('hex')}"`;

				const ifNoneMatchHeader = req.headers['if-none-match'];

				if (
					ifNoneMatchHeader &&
					ifNoneMatchHeader.split(',').some((tag) =>
						tag.trim() === etagValue
					)
				) {
					return await res.status(304).end();
				}

				const ifMatchHeader = req.headers['if-match'];

				if (
					ifMatchHeader &&
					ifMatchHeader.split(',').every((tag) =>
						tag.trim() !== etagValue
					)
				) {
					return await res.status(412).end();
				}

				res.setHeader('ETag', etagValue);
			}

			await res.status(200).sendFile(fullPath);
			next();
		})
		.use('*', async (_req, res) => {
			await res.status(405).end();
		});
};
