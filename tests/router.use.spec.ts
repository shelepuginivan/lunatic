import { describe, it, beforeEach, expect } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer, RequestHandler, Router } from '../src';

describe('Router.use()', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should register request handler', async () => {
		app.use('/', (_req, res) => {
			res.status(204).end();
		})

		await request(server)
			.get('/')
			.expect(204);
	});

	it('Should handle any method', async () => {
		app.use('/', (_req, res) => {
			res.status(204).end();
		})

		await request(server)
			.get('/')
			.expect(204);

		await request(server)
			.head('/')
			.expect(204);

		await request(server)
			.post('/')
			.expect(204);

		await request(server)
			.put('/')
			.expect(204);

		await request(server)
			.delete('/')
			.expect(204);

		await request(server)
			.options('/')
			.expect(204);

		await request(server)
			.trace('/')
			.expect(204);

		await request(server)
			.patch('/')
			.expect(204);
	});

	it('Should register Router', async () => {
		const router = new Router();

		router.get('/', (_req, res) => {
			res.status(204).end()
		});

		router.get('/route', (_req, res) => {
			res.status(204).end()
		});

		app.use('/router', router);
		app.use('/another/endpoint', router)

		await request(server)
			.get('/router')
			.expect(204);

		await request(server)
			.get('/another/endpoint/route')
			.expect(204);
	});

	it('Should be able to register nested Routers', async () => {
		const router = new Router()
		const innerRouter = new Router()
		const innerInnerRouter = new Router()

		innerInnerRouter.get('/inner', (_req, res) => {
			res.status(201).end();
		});

		innerRouter.use('/inner', innerInnerRouter);
		router.use('/inner', innerRouter);
		app.use('/inner', router)

		await request(server)
			.get('/inner/inner/inner/inner')
			.expect(201);
	})

	it('Should be able to register many nested Routers', async () => {
		let router = new Router()
		let newRouter = new Router()
		let i: number;

		app.use('/', router)

		for (i = 0; i < 1000; i++) {
			newRouter = new Router();
			router.use('/', newRouter);
			router = newRouter
		}

		newRouter.get('/', (_req, res) => {
			res.status(200).json({ i })
		})

		await request(server)
			.get('/')
			.expect(200)
			.expect({ i: 1000 });
	});

	it('Should be able to register many middlewares', async () => {
		let callNumber = 0;

		for (let i = 0; i < 1000; i++) {
			app.use('/', (_req, _res, next) => {
				callNumber++;
				next()
			});
		}

		app.get('/', (_req, res) => {
			res.status(200).json({ callNumber })
		})

		await request(server)
			.get('/')
			.expect(200)
			.expect({ callNumber: 1000 });
	});

	it('Should call middlewares in correct order', async () => {
		const callOrder: string[] = [];
		const expectedCallOrder = ['a', 'b', 'c', 'd', 'e']

		const middleware = (letter: string): RequestHandler => (_req, _res, next) => {
			callOrder.push(letter);
			next();
		}

		app.use(middleware('a'));
		app.use(middleware('b'));
		app.use(middleware('c'));
		app.use(middleware('d'));
		app.use(middleware('e'));
		app.get('/', (_req, res) => {
			res.status(204).end();
		})

		await request(server)
			.get('/')
			.expect(204);

		expect(callOrder).toEqual(expectedCallOrder);
	});
});
