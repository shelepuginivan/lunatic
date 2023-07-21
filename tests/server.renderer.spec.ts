import { beforeEach, describe, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer, RenderFunction } from '../src';
import { readFile } from 'fs/promises';
import { join } from 'path';

describe('LunaticServer.renderer()', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should render the exact content by default', async () => {
		const html = '<h1>Hello world</h1>'

		app.get('/', (_req, res) => {
			res.render(html);
		});

		await request(server)
			.get('/')
			.expect('Content-Type', 'text/html')
			.expect(html);
	});

	it('Should be able to use custom render functions', async () => {
		const html = '<h1>{{ value }}</h1>'

		const renderFunction: RenderFunction = (source, options) => {
			for (const key in options) {
				source = source.replace(`{{ ${key} }}`, options[key]);
			}

			return source;
		}

		app.renderer(renderFunction);

		app.get('/', (_req, res) => {
			res.render(html, {
				value: 'Hello custom render function'
			});
		});

		await request(server)
			.get('/')
			.expect('Content-Type', 'text/html')
			.expect('<h1>Hello custom render function</h1>');
	});

	it('Should be able to render files', async () => {
		const pathToHtml = join(__dirname, 'mocks', 'files', '2.html');
		const htmlContent = await readFile(pathToHtml);
		const html = htmlContent.toString();

		const expectedHtml = html.replace('{{ value }}', 'foo');

		const renderFunction: RenderFunction = (source, options) => {
			for (const key in options) {
				source = source.replace(`{{ ${key} }}`, options[key]);
			}

			return source;
		}

		app.renderer(renderFunction);

		app.get('/', (_req, res) => {
			res.renderFile(pathToHtml, {
				value: 'foo'
			});
		});

		await request(server)
			.get('/')
			.expect('Content-Type', 'text/html')
			.expect(expectedHtml);
	});

	it('Should respond with 404 if file does not exist', async () => {
		const path = join(__dirname, 'mocks', 'files', '__does_not_exist__.html')

		app.get('/', (_req, res) => {
			res.status(200).renderFile(path);
		});

		await request(server)
			.get('/')
			.expect(404);
	});

	it('Should respond with 404 if provided path is a directory', async () => {
		const path = join(__dirname, 'mocks', 'files')

		app.get('/', (_req, res) => {
			res.status(200).renderFile(path);
		});

		await request(server)
			.get('/')
			.expect(404);
	});
});
