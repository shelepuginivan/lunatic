import { beforeEach, describe, expect, it } from '@jest/globals';
import { LunaticServer, Router } from '../src';
import { Server } from 'http';
import request from 'supertest';
import { mockReqBody } from './mocks/req.body.mock';

describe('LunaticServer features', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	})

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

	it('Should not process HEAD requests if feature "auto-head-handler" disabled', async () => {
		const body = mockReqBody[1];

		const router = new Router();

		router.get('/', (_req, res) => {
			res.status(200).json(body);
		})

		app.disable('auto-head-handler');
		app.use('/router', router);

		await request(server)
			.get('/router')
			.expect(200)
			.expect(body);

		await request(server)
			.head('/router')
			.expect(501);
	});

	it('Should set X-Powered-By header by default', async () => {
		app.get('/', (_req, res) => {
			res.status(204).end();
		})

		request(server)
			.get('/')
			.expect('X-Powered-By', 'Lunatic');
	});

	it('Should not set X-Powered-By header if feature is disabled', async () => {
		app
			.disable('x-powered-by')
			.get('/', (_req, res) => {
			res.status(204).end();
		})

		const res = await request(server).get('/');

		expect(res.headers).not.toHaveProperty('x-powered-by');
	});

	it('Should be able to enable features', async () => {
		app.disable('x-powered-by');

		app.get('/', (_req, res) => {
			app.enable('x-powered-by');
			res.status(204).end();
		})

		const res = await request(server).get('/');

		expect(res.headers).not.toHaveProperty('x-powered-by');

		await request(server)
			.get('/')
			.expect('X-Powered-By', 'Lunatic');
	});

	it('Should be able to toggle features', async () => {
		app.get('/', (_req, res) => {
			app.toggle('x-powered-by');
			res.status(204).end();
		});

		// 1st request, feature x-powered-by is enabled
		await request(server)
			.get('/')
			.expect('X-Powered-By', 'Lunatic');

		// 2nd request, feature x-powered-by is disabled
		const res = await request(server).get('/');

		expect(res.headers).not.toHaveProperty('x-powered-by');

		// 3rd request, feature x-powered-by is enabled
		await request(server)
			.get('/')
			.expect('X-Powered-By', 'Lunatic');
	})
});
