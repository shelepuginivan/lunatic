import { existsSync } from 'fs';
import { readFile, stat } from 'fs/promises';
import * as http from 'http';
import { extname } from 'path';

import { RenderFunction } from './types/render-function';
import { Mime } from './utils/mime';

export class Response {
	constructor(
		private readonly res: http.ServerResponse,
		private readonly renderFunction: RenderFunction
	) {}

	public async end(): Promise<void> {
		this.res.end();
	}

	public async json(body: object): Promise<void> {
		this.res.setHeader('Content-Type', 'application/json');
		this.res.end(JSON.stringify(body));
	}

	public async redirect(location: string): Promise<void> {
		this.setHeader('Location', location);
		this.res.end();
	}

	public async render(path: string, options?: Record<string, string>) {
		const stats = existsSync(path) && await stat(path);

		if (!stats || stats.isDirectory()) {
			return this.status(404).end();
		}

		const source = await readFile(path);
		const html = this.renderFunction(source.toString(), options);
		this.setHeader('Content-Type', 'text/html');
		this.res.end(html);
	}

	public async send(path: string): Promise<void>
	public async send(buffer: Buffer, extension?: string): Promise<void>
	public async send(arg1: string | Buffer, arg2?: string): Promise<void> {
		if (typeof arg1 === 'string') {
			const stats = existsSync(arg1) && await stat(arg1);

			if (!stats || stats.isDirectory()) {
				return this.status(404).end();
			}

			const extension = extname(arg1);
			const file = await readFile(arg1);
			const contentType = Mime.get(extension);

			this.setHeaders({
				'Content-Length': stats.size,
				'Content-Type': contentType
			});

			await this.res.end(file);
		} else {
			const contentType = Mime.get(arg2);

			this.setHeaders({
				'Content-Length': arg1.length,
				'Content-Type': contentType
			});

			this.res.end(arg1);
		}
	}

	public setHeader(name: string, value: number | string | string[]): this {
		this.res.setHeader(name, value);
		return this;
	}

	public setHeaders(headers: Record<string, number | string | string[]>): this {
		for (const name in headers) {
			this.res.setHeader(name, headers[name]);
		}

		return this;
	}

	public status(status: number): Response {
		this.res.statusCode = status;
		return this;
	}

	public async text(body: string): Promise<void> {
		this.setHeader('Content-Type', 'text/plain');
		this.res.end(body);
	}
}
