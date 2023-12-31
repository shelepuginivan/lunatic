import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer, RequestHandler, Router } from '../src';

describe('Router', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should support method chaining', () => {
		const router = new Router();

		const emptyMiddleware: RequestHandler = (_req, _res, next) => next();

		expect(router.use(emptyMiddleware)).toBe(router);
		expect(router.get(emptyMiddleware)).toBe(router);
		expect(router.head(emptyMiddleware)).toBe(router);
		expect(router.post(emptyMiddleware)).toBe(router);
		expect(router.put(emptyMiddleware)).toBe(router);
		expect(router.delete(emptyMiddleware)).toBe(router);
		expect(router.options(emptyMiddleware)).toBe(router);
		expect(router.connect(emptyMiddleware)).toBe(router);
		expect(router.trace(emptyMiddleware)).toBe(router);
		expect(router.patch(emptyMiddleware)).toBe(router);
	});

	it('Should support dynamic routes (:)', async () => {
		const router = new Router();

		router.get('/article/:article', (req, res) => {
			res.status(200).json(req.params);
		});

		app.use('/:user', router);

		app.get('/:id', (req, res) => {
			res.status(200).json(req.params);
		});

		app.get('/some/:param/route', (req, res) => {
			res.status(200).json(req.params);
		});

		app.get('/multiple/:a/:b/:c/:d/:e', (req, res) => {
			res.status(200).json(req.params);
		});

		await request(server)
			.get('/928347203847')
			.expect(200)
			.expect({ id: '928347203847' });

		await request(server)
			.get('/username/article/3809842093')
			.expect(200)
			.expect({ article: '3809842093', user: 'username' });

		await request(server)
			.get('/some/value/route')
			.expect(200)
			.expect({ param: 'value' });

		await request(server)
			.get('/multiple/1/2/3/4/5')
			.expect(200)
			.expect({ a: '1', b: '2', c: '3', d: '4', e: '5' });
	});

	it('Should support dynamic routes (...)', async () => {
		app.get('/data/...tokens', (req, res) => {
			res.status(200).json(req.params);
		});

		app.get('/another/...tokens/data', (req, res) => {
			res.status(200).json(req.params);
		});

		app.get('/multiple/...parts1/...parts2', async (req, res) => {
			res.status(200).json(req.params);
		});

		await request(server)
			.get('/data/a/b/c/d/e/f')
			.expect(200)
			.expect({ tokens: ['a', 'b', 'c', 'd', 'e', 'f'] });

		await request(server)
			.get('/another/1/2/3/data')
			.expect(200)
			.expect({ tokens: ['1', '2', '3'] });

		await request(server)
			.get('/multiple/1/2/3/4/5/6')
			.expect(200)
			.expect({ parts1: ['1', '2', '3', '4', '5'], parts2: ['6'] });
	});

	it('Should support dynamic routes (*)', async () => {
		app.get('/any/*', (req, res) => {
			res.status(200).json(req.params);
		});

		app.get('/another/*/end', (_req, res) => {
			res.status(204).end();
		});

		await request(server)
			.get('/any/a/b/c/d/e/f')
			.expect(200)
			.expect({});

		await request(server)
			.get('/another/a/b/c/d/e/f/end')
			.expect(204);

		await request(server)
			.get('/any/1/')
			.expect(200)
			.expect({});

		await request(server)
			.get('/any')
			.expect(501);
	});

	it('Should support combinations of dynamic paths', async () => {
		app.get('/__1__/...tokens/:a/:b/:c', (req, res) => {
			res.status(200).json(req.params);
		});

		app.get('/__2__/:a/:b/:c/*', (req, res) => {
			res.status(200).json(req.params);
		});

		app.get('/__3__/*/:a/:b', (req, res) => {
			res.status(200).json(req.params);
		});

		app.get('/__4__/...parts1/:p/...parts2', (req, res) => {
			res.status(200).json(req.params);
		});

		await request(server)
			.get('/__1__/1/2/3/4/5/6')
			.expect(200)
			.expect({ tokens: ['1', '2', '3'], a: '4', b: '5', c: '6' });

		await request(server)
			.get('/__2__/1/2/3/a/b/c/d/e/d')
			.expect(200)
			.expect({ a: '1', b: '2', c: '3' });

		await request(server)
			.get('/__3__/a/b/c/d/e/f/1/2')
			.expect(200)
			.expect({ a: '1', b: '2' });

		await request(server)
			.get('/__4__/a/b/c/d/e/1/2')
			.expect(200)
			.expect({ parts1: ['a', 'b', 'c', 'd', 'e'], p: '1', parts2: ['2'] });
	});

	it('Should ignore search', (done) => {
		const router = new Router();

		router.get('/posts', (_req, res) => {
			res.status(200).end();
		});

		app.get('/', (_req, res) => {
			res.status(204).end();
		});

		app.use('/api', router);

		request(server)
			.get('/?id=219309132890')
			.expect(204)
			.end((error) => {
				if (error) {
					done(error);
				}
			});

		request(server)
			.get('/api/posts?page=1&limit=10')
			.expect(200)
			.end(done);
	});
});
