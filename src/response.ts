import { existsSync } from 'fs';
import { readFile, stat } from 'fs/promises';
import * as http from 'http';
import { extname } from 'path';

import { CookieOptions } from './types/cookie-options';
import { RenderFunction } from './types/render-function';
import { Mime } from './utils/mime';

export class Response {
	private readonly setCookies: string[];

	constructor(
		private readonly res: http.ServerResponse,
		private readonly renderFunction: RenderFunction
	) {
		this.setCookies = [];
	}

	public clearCookie(name: string, options?: CookieOptions): this {
		const setCookieHeaderValue = this.parseCookieOptions(name, '', {
			...options,
			expires: 0
		});

		this.setCookies.push(setCookieHeaderValue);
		this.setHeader('Set-Cookie', this.setCookies);

		return this;
	}

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

	public async send(content: string | Buffer, mimetype?: string) {
		mimetype = mimetype || Mime.get(null);

		if (typeof content === 'string') {
			content = Buffer.from(content, 'utf16le');
		}

		this.setHeaders({
			'Content-Length': content.length,
			'Content-Type': mimetype
		});

		this.res.end(content);
	}

	public async sendFile(path: string): Promise<void> {
		const stats = existsSync(path) && await stat(path);

		if (!stats || stats.isDirectory()) {
			return this.status(404).end();
		}

		const extension = extname(path);
		const file = await readFile(path);
		const contentType = Mime.get(extension);

		this.setHeaders({
			'Content-Length': stats.size,
			'Content-Type': contentType
		});

		await this.res.end(file);
	}

	public setCookie(name: string, value: number | string, options?: CookieOptions): this {
		const setCookieHeaderValue = this.parseCookieOptions(name, value, options);

		this.setCookies.push(setCookieHeaderValue);
		this.setHeader('Set-Cookie', this.setCookies);

		return this;
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

	private parseCookieOptions(name: string, value: number | string, options?: CookieOptions): string {
		const tokens: string[] = [`${name}=${value}`];

		tokens.push(`Path=${options?.path ?? '/'}`);

		if (options?.expires !== undefined) {
			if (typeof options.expires === 'number') {
				tokens.push(`Expires=${new Date(options.expires).toUTCString()}`);
			} else {
				const timestamp = Date.parse(options.expires);

				if (!isNaN(timestamp)) {
					tokens.push(`Expires=${new Date(timestamp).toUTCString()}`);
				}
			}
		}

		if (options?.maxAge !== undefined) {
			tokens.push(`Max-Age=${options.maxAge}`);
		}

		if (options?.httpOnly) {
			tokens.push('HttpOnly');
		}

		if (options?.secure) {
			tokens.push('Secure');
		}

		if (options?.domain) {
			tokens.push(`Domain=${options.domain}`);
		}

		if (options?.sameSite) {
			tokens.push(`SameSite=${options.sameSite}`);
		}

		return tokens.join('; ');
	}
}
