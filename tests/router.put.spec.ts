import { beforeEach, describe, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest'

import { LunaticServer, Router } from '../src'


describe('Router.put()', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should accept PUT requests', (done) => {
		const router = new Router();

		router.put('/router', (_req, res) => {
			res.status(204).end()
		})

		app.use('/', router);

		request(server)
			.put('/router')
			.expect(204)
			.end(done);
	});

	it('Should not accept requests with other methods', (done) => {
		const router = new Router();

		router.put('/router', (_req, res) => {
			res.status(204).end()
		})

		app.use('/', router);

		request(server)
			.get('/router')
			.expect(501)
			.end(done);
	})
});
