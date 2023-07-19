import { beforeEach, describe, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest'

import { LunaticServer } from '../src'
import { Router } from '../src';

describe('Router', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should support dynamic routes (:)', (done) => {
		const router = new Router();

		router.get('/article/:article', (req, res) => {
			res.status(200).json(req.params);
		});

		app.use('/:user', router);

		app.get('/:id', (req, res) => {
			res.status(200).json(req.params);
		});

		request(server)
			.get('/928347203847')
			.expect(200)
			.expect({ id: '928347203847' })
			.end((error) => {
				if (error) {
					done(error)
				}
			});

		request(server)
			.get('/username/article/3809842093')
			.expect(200)
			.expect({ article: '3809842093', user: 'username' })
			.end(done);
	});

	it('Should support dynamic routes (...)', (done) => {
		app.get('/data/...tokens', (req, res) => {
			res.status(200).json(req.params);
		});

		request(server)
			.get('/data/a/b/c/d/e/f')
			.expect(200)
			.expect({ tokens: ['a', 'b', 'c', 'd', 'e', 'f'] })
			.end(done);
	});

	it('Should support dynamic routes (*)', (done) => {
		app.get('/any/*', (req, res) => {
			res.status(200).json(req.params);
		});

		request(server)
			.get('/any/a/b/c/d/e/f')
			.expect(200)
			.expect({})
			.end((error) => {
				if (error) {
					done(error);
				}
			});

		request(server)
			.get('/any/1/')
			.expect(200)
			.expect({})
			.end((error) => {
				if (error) {
					done(error);
				}
			});

		request(server)
			.get('/any')
			.expect(501)
			.end(done);
	});

	it('Should ignore search', (done) => {
		const router = new Router()

		router.get('/posts', (_req, res) => {
			res.status(200).end();
		})

		app.get('/', (_req, res) => {
			res.status(204).end();
		})

		app.use('/api', router)

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

	})
});