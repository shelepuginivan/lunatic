import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { bodyParser,LunaticServer, Router } from '../src';
import { mockReqBody } from './mocks/req.body.mock';


describe('middlewares/bodyParser()', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should parse body from incoming request', (done) => {
		app.use(bodyParser);
		app.post('/', (req, res) => {
			expect(req.body).toBeDefined();
			res.status(200).json(req.body as Record<string, unknown>);
		});

		const body = mockReqBody[2];

		request(server)
			.post('/')
			.send(body)
			.expect(200)
			.expect(body)
			.end(done);
	});

	it('Should work in Router', (done) => {
		const router = new Router();
		const anotherRouter = new Router();

		router.use(bodyParser);
		router.post('/body', (req, res) => {
			expect(req.body).toBeDefined();
			res.status(200).json(req.body as Record<string, unknown>);
		});

		anotherRouter.post('/body', (req, res) => {
			expect(req.body).toBeUndefined();
			res.status(422).end();
		});

		app.use('/', router);
		app.use('/another', anotherRouter);

		const body = mockReqBody[0];

		request(server)
			.post('/body')
			.send(body)
			.expect(200)
			.expect(body)
			.end((error) => {
				if (error) {
					done(error);
				}
			});

		request(server)
			.post('/another/body')
			.send(body)
			.expect(422)
			.end(done);
	});

	it('Should parse text body', (done) => {
		app.use(bodyParser);
		app.post('/', (req, res) => {
			expect(req.body).toEqual(expect.any(String));
			res.status(200).text(req.body as string);
		});

		const body = 'some_text';

		request(server)
			.post('/')
			.set('Content-Type', 'text/plain')
			.send(body)
			.expect(200)
			.expect(body)
			.end(done);
	});

	it('Should ignore formats other than "text/plain" and "application/json"', async () => {
		app.use(bodyParser);
		app.post('/', (req, res) => {
			expect(req.body).toBeUndefined();
			res.end();
		});

		await request(server)
			.post('/')
			.set('Content-Type', 'multipart/form-data')
			.field('test', 'value');
	});

	it('Should skip body parse stage if body was not provided', async () => {
		app.use(bodyParser);
		app.post('/', (req, res) => {
			expect(req.body).toBeUndefined();
			res.end();
		});

		await request(server).post('/');
	});
});
