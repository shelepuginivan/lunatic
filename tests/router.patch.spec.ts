import { beforeEach, describe, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest'

import { LunaticServer, Router } from '../src'


describe('Router.patch()', () => {
	let server: Server
	let app: LunaticServer;

	beforeEach(() => {
		app = new LunaticServer()
		server = new Server(app.callback)
	});

	it('Should accept PATCH requests', (done) => {
		const router = new Router();

		router.patch('/router', (_req, res) => {
			res.status(204).end()
		})

		app.use('/', router);

		request(server)
			.patch('/router')
			.expect(204)
			.end(done);
	});

	it('Should not accept requests with other methods', (done) => {
		const router = new Router();

		router.patch('/router', (_req, res) => {
			res.status(204).end()
		})

		app.use('/', router);

		request(server)
			.get('/router')
			.expect(501)
			.end(done);
	})
});
