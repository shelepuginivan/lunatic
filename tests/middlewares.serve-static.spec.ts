import { beforeEach, describe, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer, serveStatic } from '../src';
import { join } from 'path';
import { readFile } from 'fs/promises';


describe('middlewares/serveStatic()', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should send files', async () => {
		const path = join(__dirname, 'mocks', 'files', '1.png');
		const imageBuffer = await readFile(path);

		app.use('/static', serveStatic(join(__dirname, 'mocks', 'files')));

		await request(server)
			.get('/static/1.png')
			.expect(200)
			.expect('Content-Type', 'image/png')
			.expect('Content-Length', String(imageBuffer.length))
			.expect(imageBuffer);
	});

	it('Should respond with status 405 if method is not GET (or HEAD)', async () => {
		app.use('/static', serveStatic(join(__dirname, 'mocks', 'files')));

		await request(server)
			.post('/static/1.png')
			.expect(405);

		await request(server)
			.put('/static/1.png')
			.expect(405);

		await request(server)
			.delete('/static/1.png')
			.expect(405);

		await request(server)
			.options('/static/1.png')
			.expect(405);

		await request(server)
			.trace('/static/1.png')
			.expect(405);

		await request(server)
			.patch('/static/1.png')
			.expect(405);
	});
});
