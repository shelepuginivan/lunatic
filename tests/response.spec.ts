import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { mockReqFiles } from './mocks/req.files.mock';
import { cookieParser, LunaticServer } from '../src';
import { join } from 'path';
import { readFile } from 'fs/promises';

describe('Response', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should be able to be sent on client', (done) => {
		app.get('/', (_req, res) => {
			res.end();
		})

		request(server)
			.get('/')
			.expect(200)
			.end(done);
	});

	it('Should be able to set status', (done) => {
		app.get('/', (_req, res) => {
			res.status(204).end();
		});

		request(server)
			.get('/')
			.expect(204)
			.end(done);
	});

	it('Should be able to send plain text', async () => {
		app.get('/', (_req, res) => {
			res.status(200).text('plain text');
		});

		const res = await request(server)
			.get('/')
			.expect(200)
			.expect('plain text');

		expect(res.headers['content-type']).toBe('text/plain');
	});

	it('Should be able to send JSON', (done) => {
		app.get('/', (_req, res) => {
			res.status(200).json({ json: true });
		});

		request(server)
			.get('/')
			.expect(200)
			.expect({ json: true })
			.expect('Content-Type', 'application/json')
			.end(done);
	});

	it('Should be able to redirect request', (done) => {
		app.get('/', (_req, res) => {
			res.status(301).redirect('https://github.com');
		});

		request(server)
			.get('/')
			.redirects(0)
			.expect(301)
			.expect('Location', 'https://github.com')
			.end(done);
	});

	it('Should be able to set headers', (done) => {
		app.get('/', (_req, res) => {
			res
				.setHeader('X-Test-Header', 'test-value')
				.setHeader('X-Test-Number', 38239483)
				.setHeader('X-Test-Multiple', ['a', 'b', 'c'])
				.status(200)
				.end();
		});

		request(server)
			.get('/')
			.expect('X-Test-Header', 'test-value')
			.expect('X-Test-Number', '38239483')
			.expect('X-Test-Multiple', 'a, b, c')
			.end(done);
	});

	it('Should be able to set multiple headers at once', (done) => {
		app.get('/', (_req, res) => {
			res
				.setHeaders({
					'X-Test-Header': 'someValue',
					'X-Test-Number': 3840923849032,
					'X-Test-Multiple': ['a', 'b', 'c']
				})
				.status(200)
				.end();
		});

		request(server)
			.get('/')
			.expect('X-Test-Header', 'someValue')
			.expect('X-Test-Number', '3840923849032')
			.expect('X-Test-Multiple', 'a, b, c')
			.end(done);
	});

	it('Should be able to set cookies', (done) => {
		const expires = Date.now() + 3600;

		app.get('/', (_req, res) => {
			res
				.setCookie('default', 'light')
				.setCookie('httponly', 'some', { httpOnly: true })
				.setCookie('expires', 930434, { expires })
				.end();

		});

		request(server)
			.get('/')
			.expect(
				'Set-Cookie',
				`default=light; Path=/; SameSite=Lax,httponly=some; Path=/; HttpOnly; SameSite=Lax,expires=930434; Path=/; Expires=${new Date(expires).toUTCString()}; SameSite=Lax`
			)
			.end(done);
	});

	it('Should not set Expires attribute if provided value in invalid', async () => {
		app.get('/', (_req, res) => {
			res
				.setCookie('some', 'value', { expires: NaN })
				.setCookie('another', 930434, { expires: 'invalid time string' })
				.end();

		});

		await request(server)
			.get('/')
			.expect(
				'Set-Cookie',
				`some=value; Path=/; SameSite=Lax,another=930434; Path=/; SameSite=Lax`
			);
	});

	it('Should be able to set different cookie attributes', async () => {
		app.get('/', (_req, res) => {
			res
				.setCookie('some', 'value', { secure: true, sameSite: 'None' })
				.setCookie('another', 930434, { maxAge: 60 * 1000, domain: 'example.com' })
				.setCookie('with', 'path', { path: '/api' })
				.end();

		});

		await request(server)
			.get('/')
			.expect(
				'Set-Cookie',
				'some=value; Path=/; Secure; SameSite=None,' +
				'another=930434; Path=/; Max-Age=60000; Domain=example.com; SameSite=Lax,' +
				'with=path; Path=/api; SameSite=Lax'
			);
	});

	it('Should be able to clear cookies', async () => {
		const expired = new Date(0).toUTCString();

		app.use(cookieParser);
		app.get('/', async (_req, res) => {
			await res
				.clearCookie('id')
				.clearCookie('value')
				.clearCookie('some')
				.status(204)
				.end();
		});

		await request(server)
			.get('/')
			.set('Cookie', 'id=394839; some=asdasd; value=asdjojdw')
			.expect(204)
			.expect(
				'Set-Cookie',
				`id=; Path=/; Expires=${expired}; SameSite=Lax,value=; Path=/; Expires=${expired}; SameSite=Lax,some=; Path=/; Expires=${expired}; SameSite=Lax`
			);
	});

	it('Should be able to send Buffer as response', async () => {
		const mockBuffer = mockReqFiles[0];

		app.get('/', (_req, res) => {
			res.status(200).send(mockBuffer, 'text/plain');
		});

		await request(server)
			.get('/')
			.expect(200)
			.expect(mockBuffer.toString())
			.expect('Content-Type', 'text/plain')
			.expect('Content-Length', String(mockBuffer.length));
	});

	it('Should set Content-Type to "application/octet-stream" by default', async () => {
		const mockBuffer = mockReqFiles[1];

		app.get('/', (_req, res) => {
			res.status(200).send(mockBuffer);
		});

		await request(server)
			.get('/')
			.expect(200)
			.expect(mockBuffer)
			.expect('Content-Type', 'application/octet-stream')
			.expect('Content-Length', String(mockBuffer.length));
	});

	it('Should be able to send files', async () => {
		const path = join(__dirname, 'mocks', 'files', '1.png')
		const imageBuffer = await readFile(path);

		app.get('/', (_req, res) => {
			res.status(200).sendFile(path);
		});

		await request(server)
			.get('/')
			.expect(200)
			.expect(imageBuffer)
			.expect('Content-Type', 'image/png')
			.expect('Content-Length', String(imageBuffer.length));
	});

	it('Should respond with 404 if file does not exist', async () => {
		const path = join(__dirname, 'mocks', 'files', '__does_not_exist__.txt')

		app.get('/', (_req, res) => {
			res.status(200).sendFile(path);
		});

		await request(server)
			.get('/')
			.expect(404);
	});

	it('Should respond with 404 if provided path is a directory', async () => {
		const path = join(__dirname, 'mocks', 'files')

		app.get('/', (_req, res) => {
			res.status(200).sendFile(path);
		});

		await request(server)
			.get('/')
			.expect(404);
	});

	it('Should be able to remove headers (.removeHeader())', async () => {
		app.get('/', (_req, res) => {
			res
				.status(200)
				.removeHeader('Date')
				.removeHeader('X-Powered-By')
				.end();
		});

		const res = await request(server).get('/');

		expect(res.headers).not.toHaveProperty('date');
		expect(res.headers).not.toHaveProperty('x-powered-by');
	});

	it('Should be able to remove headers (.removeHeaders())', async () => {
		app.get('/', (_req, res) => {
			res
				.status(200)
				.removeHeaders(['Date', 'X-Powered-By'])
				.end();
		});

		const res = await request(server).get('/');

		expect(res.headers).not.toHaveProperty('date');
		expect(res.headers).not.toHaveProperty('x-powered-by');
	});
});
