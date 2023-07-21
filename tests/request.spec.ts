import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer, Request } from '../src';
import { mockReqBody } from './mocks/req.body.mock';

describe('Request', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should have all required properties', (done) => {
		let handledRequest: Request;

		app.get('/', (req, res) => {
			handledRequest = req;
			res.status(204).end();
		})

		request(server).get('/').end((error) => {
			if (error) {
				done(error);
			}

			expect(handledRequest).toHaveProperty('body');
			expect(handledRequest).toHaveProperty('cookies');
			expect(handledRequest).toHaveProperty('files');
			expect(handledRequest).toHaveProperty('headers');
			expect(handledRequest).toHaveProperty('method');
			expect(handledRequest).toHaveProperty('originalUrl');
			expect(handledRequest).toHaveProperty('params');
			expect(handledRequest).toHaveProperty('path');
			expect(handledRequest).toHaveProperty('protocol');
			expect(handledRequest).toHaveProperty('query');

			done();
		});
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
