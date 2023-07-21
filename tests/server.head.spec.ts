import { beforeEach, describe, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { mockReqBody } from './mocks/req.body.mock';
import { LunaticServer, Router } from '../src';


describe('LunaticServer HEAD', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should respond to HEAD requests', async () => {
		app.get('/', (_req, res) => {
			res.status(200).json(mockReqBody[0]);
		})

		await request(server).head('/').expect(204);
	});

	it('Should respond with same headers as in response on GET request', async () => {
		const body = mockReqBody[0];

		const contentLength = new TextEncoder().encode(JSON.stringify(body)).byteLength;

		app.get('/', (_req, res) => {
			res
				.setHeader('X-Total-Count', 1)
				.status(200)
				.json(body);
		})

		await request(server).head('/')
			.expect(204)
			.expect('X-Total-Count', '1')
			.expect('Content-Length', String(contentLength));
	});

	it('Should omit response body when responds to HEAD request', async () => {
		const body = mockReqBody[1];

		app.get('/', (_req, res) => {
			res.status(200).json(body);
		})

		await request(server)
			.get('/')
			.expect(200)
			.expect(body);

		await request(server)
			.head('/')
			.expect(204)
			.expect({});
	});

	it('Should work in Router', async () => {
		const body = mockReqBody[1];

		const router = new Router();

		router.get('/', (_req, res) => {
			res.status(200).json(body);
		})

		app.use('/router', router)

		await request(server)
			.get('/router')
			.expect(200)
			.expect(body);

		await request(server)
			.head('/router')
			.expect(204)
			.expect({});
	});
});
