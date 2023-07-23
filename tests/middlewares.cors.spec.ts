import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer } from '../src';
import { cors, CorsOptions } from '../src/middlewares/cors';

describe('middlewares/cors()', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	})

	it('Should set CORS headers for CORS requests', async () => {
		app.use(cors());
		app.get('/', (_req, res) => {
			res.status(200).end();
		});

		const res = await request(server)
			.get('/')
			.set('Origin', 'https://example.com')
			.expect('Access-Control-Allow-Origin', '*')
			.expect('Vary', 'Origin')
			.expect('Access-Control-Allow-Methods', '*')

		expect(res.headers).not.toHaveProperty('access-control-allow-credentials');
	});

	it('Should respond on preflight requests', async () => {
		app.use(cors());
		app.get('/', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.options('/')
			.set('Origin', 'https://example.com')
			.expect('Access-Control-Allow-Origin', '*')
			.expect('Vary', 'Origin')
			.expect('Access-Control-Allow-Methods', '*')
	})

	it('Should support configuration', async () => {
		const corsOptions1: CorsOptions = {
			origin: 'https://example.com',
			credentials: true,
			maxAge: 60 * 60 * 1000,
			preflightSuccessStatus: 200,
			allowedHeaders: ['Content-Length', 'Content-Type', 'Authorization'],
			methods: ['GET', 'POST', 'PUT', 'DELETE']
		};

		const corsOptions2: CorsOptions = {
			origin: /\.com$/,
			credentials: false,
			allowedHeaders: 'Content-Length'
		};

		const corsOptions3: CorsOptions = {
			origin: ['https://example.com', 'http://localhost:3000'],
			methods: 'GET'
		};

		const corsOptions4: CorsOptions = {
			origin: [/\.com$/, /\.org$/]
		};

		app.use('/cors1', cors(corsOptions1));
		app.get('/cors1', (_req, res) => {
			res.status(200).end();
		});

		app.use('/cors2', cors(corsOptions2));
		app.get('/cors2', (_req, res) => {
			res.status(200).end();
		});

		app.use('/cors3', cors(corsOptions3));
		app.get('/cors3', (_req, res) => {
			res.status(200).end();
		});

		app.use('/cors4', cors(corsOptions4));
		app.get('/cors4', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.options('/cors1')
			.set('Origin', 'https://example.com')
			.expect(200)
			.expect('Access-Control-Allow-Origin', 'https://example.com')
			.expect('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE')
			.expect('Access-Control-Max-Age', '3600000')
			.expect('Access-Control-Allow-Headers', 'Content-Length,Content-Type,Authorization');

		await request(server)
			.options('/cors1')
			.set('Origin', 'https://example.org')
			.expect(403);

		const res2 = await request(server)
			.options('/cors2')
			.set('Origin', 'https://example.com')
			.expect(204)
			.expect('Access-Control-Allow-Origin', 'https://example.com')
			.expect('Access-Control-Allow-Headers', 'Content-Length');

		expect(res2.headers).not.toHaveProperty('access-control-allow-credentials');

		await request(server)
			.options('/cors2')
			.set('Origin', 'http://localhost:3000')
			.expect(403)

		await request(server)
			.options('/cors3')
			.set('Origin', 'http://localhost:3000')
			.expect(204)
			.expect('Access-Control-Allow-Methods', 'GET')
			.expect('Access-Control-Allow-Origin', 'http://localhost:3000');

		await request(server)
			.options('/cors3')
			.set('Origin', 'http://localhost:5124')
			.expect(403);

		await request(server)
			.options('/cors4')
			.set('Origin', 'https://example.org')
			.expect(204)
			.expect('Access-Control-Allow-Origin', 'https://example.org');

		await request(server)
			.options('/cors4')
			.set('Origin', 'https://example.net')
			.expect(403);
	});

	it('Should block CORS request if origin is not allowed', async () => {
		const corsOptions: CorsOptions = {
			origin: 'https://foo.example',
			corsErrorStatus: 405
		};

		app.use(cors(corsOptions));
		app.get('/', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.options('/')
			.set('Origin', 'https://example.com')
			.expect(405);

		await request(server)
			.get('/')
			.set('Origin', 'https://example.com')
			.expect(405);
	});

	it('Should block CORS request if method is not allowed', async () => {
		const corsOptions: CorsOptions = {
			methods: 'GET'
		};

		app.use(cors(corsOptions));
		app.get('/', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.options('/')
			.set('Origin', 'https://example.com')
			.expect(204);

		await request(server)
			.get('/')
			.set('Origin', 'https://example.com')
			.expect(200);

		await request(server)
			.post('/')
			.set('Origin', 'https://example.com')
			.expect(403);
	});

	it('Should be able to expose headers', async () => {
		const corsOptions1: CorsOptions = {
			exposedHeaders: 'X-Powered-By'
		};

		app.use('/cors1', cors(corsOptions1));
		app.get('/cors1', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.get('/cors1')
			.set('Origin', 'https://example.com')
			.expect('Access-Control-Expose-Headers', 'X-Powered-By');

		const corsOptions2: CorsOptions = {
			exposedHeaders: ['X-Powered-By', 'Date']
		};

		app.use('/cors2', cors(corsOptions2));
		app.get('/cors2', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.get('/cors2')
			.set('Origin', 'https://example.com')
			.expect('Access-Control-Expose-Headers', 'X-Powered-By,Date');

	});

	it('Should support predicate function as origin option', async () => {
		const predicate = (origin: string) => {
			return origin.startsWith('https');
		}

		const corsOptions: CorsOptions = {
			origin: predicate
		};

		app.use(cors(corsOptions));
		app.get('/', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.get('/')
			.set('Origin', 'https://example.com')
			.expect(200);

		await request(server)
			.get('/')
			.set('Origin', 'http://localhost:8000')
			.expect(403);
	});

	it('Should be able to disable CORS by setting origin to false', async () => {
		const corsOptions: CorsOptions = {
			origin: false
		};

		app.use(cors(corsOptions));
		app.get('/', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.get('/')
			.set('Origin', 'https://example.com')
			.expect(403);

		await request(server)
			.get('/')
			.set('Origin', 'http://localhost:8000')
			.expect(403);
	});

	it('Should be able to enable all origins by setting origin to true', async () => {
		const corsOptions: CorsOptions = {
			origin: true
		};

		app.use(cors(corsOptions));
		app.get('/', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.options('/')
			.set('Origin', '*')
			.expect(204);

		await request(server)
			.get('/')
			.set('Origin', '*')
			.expect(200);
	});

	it('Should pass non-CORS requests', async () => {
		const corsOptions: CorsOptions = {
			origin: false
		};

		app.use(cors(corsOptions));
		app.get('/', (_req, res) => {
			res.status(200).end();
		});

		await request(server)
			.get('/')
			.expect(200);
	})
});
