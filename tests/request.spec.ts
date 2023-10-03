import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer } from '../src';

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
		});

		await request(server).get('/');
	});

	it('Should have expected properties', async () => {
		app.get('/', (req, res) => {
			expect(req.method).toBe('GET');
			expect(req.path).toBe('/');
			expect(req.protocol).toBe('http');
			expect(req.params).toEqual({});
			expect(req.query).toEqual({});

			res.status(204).end();
		});

		app.post('/some/endpoint', (req, res) => {
			expect(req.method).toBe('POST');
			expect(req.path).toBe('/some/endpoint');
			expect(req.protocol).toBe('http');
			expect(req.originalUrl).toBe('http://localhost:8000/some/endpoint');
			expect(req.params).toEqual({});
			expect(req.query).toEqual({});

			res.status(204).end();
		});

		await request(server).get('/');

		await request(server)
			.post('/some/endpoint')
			.set('Host', 'localhost:8000');
	});

	it('Should have query if request url contains search', async () => {
		app.get('/', (req, res) => {
			expect(req.query).toEqual({ page: '1', limit: '10' });
			res.status(204).end();
		});

		await request(server).get('/?page=1&limit=10');
	});

	it('Should have params if route is dynamic', async () => {
		app.get('/:id', (req, res) => {
			expect(req.params).toEqual({ id: '38902384' });
			res.status(204).end();
		});

		await request(server).get('/38902384');
	});
});
