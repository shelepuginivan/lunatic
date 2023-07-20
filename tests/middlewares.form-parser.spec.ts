import { beforeEach, describe, expect, it } from '@jest/globals';
import { Server } from 'http';
import request from 'supertest';

import { LunaticServer, Router, formParser } from '../src';
import { mockReqFiles } from './mocks/req.files.mock';


describe('middlewares/formParser()', () => {
	let app: LunaticServer;
	let server: Server;

	beforeEach(() => {
		app = new LunaticServer();
		server = new Server(app.callback);
	});

	it('Should parse body from incoming request', (done) => {
		app.use(formParser);
		app.post('/', (req, res) => {
			expect(req.files).toEqual(files);
			res.status(200).json(req.body as Record<string, string | string[]>);
		})

		const attachment = mockReqFiles[0]

		const files = {
			file: [
				{
					filename: '1.txt',
					data: attachment,
					mimetype: 'text/plain'
				}
			]
		}

		const body: Record<string, string> = {
			a: '1',
			b: '2'
		};


		request(server)
			.post('/')
			.field('a', '1')
			.field('b', '2')
			.attach('file', attachment, '1.txt')
			.expect(200)
			.expect(body)
			.end(done)
	});

	it('Should work in Router', (done) => {
		const router = new Router();

		router.use(formParser)
		router.post('/', (req, res) => {
			expect(req.files).toEqual(files)
			res.status(200).json(body);
		})

		app.use('/router', router);
		app.post('/form', (req, res) => {
			expect(req.files).toBeUndefined();
			expect(req.body).toBeUndefined();
			res.status(204).end()
		});

		const attachment = mockReqFiles[1];

		const files = {
			resume: [
				{
					filename: 'some.txt',
					data: attachment,
					mimetype: 'text/plain'
				}
			]
		};

		const body: Record<string, string> = {
			field: 'some',
			email: 'upgrading1866@example.com'
		};

		request(server)
			.post('/router')
			.field('field', 'some')
			.field('email', 'upgrading1866@example.com')
			.attach('resume', attachment, 'some.txt')
			.expect(200)
			.expect(body)
			.end((error) => {
				if (error) {
					done(error);
				}
			});

		request(server)
			.post('/form')
			.field('field', 'some')
			.field('email', 'upgrading1866@example.com')
			.attach('resume', attachment, 'some.txt')
			.expect(204)
			.end(done);

	});
});
