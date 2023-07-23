import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer, serveStatic, ServeStaticOptions } from '../src';
import { join } from 'path';
import { readFile, stat, writeFile } from 'fs/promises';
import { CRLF } from '../src/utils/constants';


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

	it('Should ignore dotfiles by default', async () => {
		app.use('/static', serveStatic(join(__dirname, 'mocks', 'files')));

		await request(server)
			.get('/static/.dotfile')
			.expect(404);

		await request(server)
			.get('/static/.dotdir/3.png')
			.expect(404);
	});

	it('Should return index.html if exists and path is a directory', async () => {
		const path = join(__dirname, 'mocks', 'files', 'index.html');
		const htmlBuffer = await readFile(path);

		app.use('/', serveStatic(join(__dirname, 'mocks', 'files')));

		await request(server)
			.get('/')
			.expect(200)
			.expect('Content-Type', 'text/html')
			.expect('Content-Length', String(htmlBuffer.length))
			.expect(htmlBuffer.toString());
	});

	it('Should set Last-Modified by default', async () => {
		const path = join(__dirname, 'mocks', 'files', '1.png');

		app.use('/', serveStatic(join(__dirname, 'mocks', 'files')));

		await request(server)
			.get('/1.png')
			.expect(200)
			.expect('Last-Modified', (await stat(path)).mtime.toUTCString());
	});

	it('Should set ETag by default', async () => {
		app.use('/', serveStatic(join(__dirname, 'mocks', 'files')));

		const res = await request(server)
			.get('/1.png')
			.expect(200);

		expect(res.headers).toHaveProperty('etag');
	});

	it('Should support configuration', async () => {
		const serveStaticOptions1: ServeStaticOptions = {
			lastModified: false,
			dotfiles: 'allow',
			index: '1.png',
			etag: false
		}

		const serveStaticOptions2: ServeStaticOptions = {
			dotfiles: 'forbid',
		}

		app.use('/static1', serveStatic(join(__dirname, 'mocks', 'files'), serveStaticOptions1));
		app.use('/static2', serveStatic(join(__dirname, 'mocks', 'files'), serveStaticOptions2));

		const res = await request(server)
			.get('/static1')
			.expect(200)
			.expect('Content-Type', 'image/png');

		await request(server)
			.get('/static1/.dotfile')
			.expect(200);

		expect(res.headers).not.toHaveProperty('etag');
		expect(res.headers).not.toHaveProperty('last-modified');

		await request(server)
			.get('/static2/.dotfile')
			.expect(403);
	});

	it('Should return 404 if file not found', async () => {
		app.use('/', serveStatic(join(__dirname, 'mocks', 'files')));

		await request(server)
			.get('/__does_not_exist__.txt')
			.expect(404);
	});

	it('Should return 404 if file not found', async () => {
		app.use('/', serveStatic(join(__dirname, 'mocks', 'files')));

		await request(server)
			.get('/__does_not_exist__.txt')
			.expect(404);
	});

	it('Should return 404 if file is a directory and index was not found', async () => {
		app.use('/', serveStatic(
			join(__dirname, 'mocks', 'files'),
			{ index: '__does_not_exist__.txt' }
		));

		await request(server)
			.get('/')
			.expect(404);
	});

	it('Should return 404 if file is a directory and index is false', async () => {
		app.use('/', serveStatic(
			join(__dirname, 'mocks', 'files'),
			{ index: false }
		));

		await request(server)
			.get('/')
			.expect(404);
	});

	it('Should return 304 if request has If-None-Match header and file was not modified', async () => {
		app.use('/', serveStatic(join(__dirname, 'mocks', 'files'),));

		const res = await request(server)
			.get('/')
			.expect(200);

		expect(res.headers).toHaveProperty('etag');

		const etag = res.headers.etag as string;

		await request(server)
			.get('/')
			.set('If-None-Match', etag)
			.expect(304);
	});

	it('Should return 412 if request has If-Match header and file was modified', async () => {
		const simulateContentChange = async () => {
			const file = join(__dirname, 'mocks', 'files', 'modify.txt');
			const content = await readFile(file);
			await writeFile(file, content + CRLF)
			await writeFile(file, content);
		}

		app.use('/', serveStatic(join(__dirname, 'mocks', 'files'),));

		const res = await request(server)
			.get('/modify.txt')
			.expect(200);

		expect(res.headers).toHaveProperty('etag');

		const etag = res.headers.etag as string;

		await simulateContentChange();

		await request(server)
			.get('/modify.txt')
			.set('If-Match', etag)
			.expect(412);
	});
});
