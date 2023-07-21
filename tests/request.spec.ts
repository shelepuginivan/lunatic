import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer } from '../src';
import { mockReqBody } from './mocks/req.body.mock';

describe('Request', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should have all required properties', async () => {

		app.get('/', (req, res) => {
			expect(req).toHaveProperty('body');
			expect(req).toHaveProperty('cookies');
			expect(req).toHaveProperty('files');
			expect(req).toHaveProperty('headers');
			expect(req).toHaveProperty('method');
			expect(req).toHaveProperty('originalUrl');
			expect(req).toHaveProperty('params');
			expect(req).toHaveProperty('path');
			expect(req).toHaveProperty('protocol');
			expect(req).toHaveProperty('query');

			res.status(204).end();
		})

		await request(server).get('/');
	});

	it('Should support .on() listeners', (done) => {
		app.post('/', (req, res) => {
			req
				.on('data', (chunk) => expect(chunk).toBeInstanceOf(Uint8Array))
				.on('end', () => {
					res.status(204).end();
					done();
				})
				.on('error', done)
		})

		request(server)
			.post('/')
			.send(mockReqBody[0])
			.end();
	});
});
