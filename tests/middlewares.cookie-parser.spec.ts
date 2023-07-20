import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { cookieParser, LunaticServer, Router } from '../src';

describe('middlewares/cookieParser()', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should parse cookies from incoming request', (done) => {
		app.use(cookieParser);
		app.get('/', (req, res) => {
			expect(req.cookies).toBeDefined();
			res.status(200).json(req.cookies as Record<string, string>);
		});

		request(server)
			.get('/')
			.set('Cookie', 'id=31943480329482309')
			.expect(200)
			.expect({ id: '31943480329482309' })
			.end(done);
	});

	it('Should work in Router', (done) => {
		const router = new Router();

		router.use(cookieParser);
		router.get('/', (req, res) => {
			expect(req.cookies).toBeDefined();
			res.status(200).json(req.cookies as Record<string, string>);
		});

		app.use('/router', router);
		app.get('/',(req, res) => {
			expect(req.cookies).toBeUndefined();
			res.status(204).end();
		});

		request(server)
			.get('/router')
			.set('Cookie', 'id=31943480329482309')
			.expect(200)
			.expect({ id: '31943480329482309' })
			.end((error) => {
				if (error) {
					done(error);
				}
			});

		request(server)
			.get('/')
			.set('Cookie', 'id=31943480329482309')
			.expect(204)
			.end(done);
	})
});
