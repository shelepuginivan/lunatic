import { existsSync } from 'fs';
import { readFile, stat } from 'fs/promises';
import { ServerResponse } from 'http';
import { extname } from 'path';

import { CookieOptions } from './types/cookie-options';
import { RenderFunction } from './types/render-function';
import { Mime } from './utils/mime';

export class Response {
	private readonly setCookies: string[];
	private omitResponseBody: boolean;

	constructor(
		public readonly serverResponse: ServerResponse,
		private readonly renderFunction: RenderFunction
	) {
		this.setCookies = [];
		this.omitResponseBody = false;
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

	public earlyHints(hints: Record<string, string | string[]>): Promise<void> {
		return new Promise(
			(resolve: () => void) => this.serverResponse.writeEarlyHints(hints, resolve)
		);
	}

	public end(): Promise<void> {
		return new Promise(
			(resolve: () => void) => this.serverResponse.end(resolve)
		);
	}

	public json(body: object): Promise<void> {
		return this.send(JSON.stringify(body), 'application/json');
	}

	public redirect(location: string): Promise<void> {
		this.setHeader('Location', location);
		return this.end();
	}

	public render(source: string, options?: Record<string, unknown>): Promise<void> {
		const html = this.renderFunction(source, options);
		return this.send(html, 'text/html');
	}

	public async renderFile(path: string, options?: Record<string, unknown>): Promise<void> {
		const stats = existsSync(path) && await stat(path);

		if (!stats || stats.isDirectory()) {
			return this.status(404).end();
		}

		const source = await readFile(path);
		const html = this.renderFunction(source.toString(), options);

		return this.send(html, 'text/html');
	}

	public async send(content?: string | Buffer, mimetype?: string): Promise<void> {
		if (content === undefined) {
			return this.status(204).end();
		}

		mimetype = mimetype || Mime.get(null);

		const contentLength = typeof content === 'string'
			? new TextEncoder().encode(content).byteLength
			: content.byteLength;

		this.setHeaders({
			'Content-Length': contentLength,
			'Content-Type': mimetype
		});

		if (this.omitResponseBody) {
			return this.status(204).end();
		}

		this.serverResponse.end(content);
	}

	public async sendFile(path: string): Promise<void> {
		const stats = existsSync(path) && await stat(path);

		if (!stats || stats.isDirectory()) {
			return this.status(404).end();
		}

		const extension = extname(path);
		const fileContent = await readFile(path);
		const contentType = Mime.get(extension);

		await this.send(fileContent, contentType);
	}

	public setCookie(name: string, value: number | string, options?: CookieOptions): this {
		const setCookieHeaderValue = this.parseCookieOptions(name, value, options);

		this.setCookies.push(setCookieHeaderValue);
		this.setHeader('Set-Cookie', this.setCookies);

		return this;
	}

	public setHeader(name: string, value: number | string | string[]): this {
		this.serverResponse.setHeader(name, value);
		return this;
	}

	public setHeaders(headers: Record<string, number | string | string[]>): this {
		for (const name in headers) {
			this.serverResponse.setHeader(name, headers[name]);
		}

		return this;
	}

	public removeHeader(name: string): this {
		this.serverResponse.removeHeader(name);
		return this;
	}

	public removeHeaders(headers: string[]): this {
		headers.forEach((header) => this.serverResponse.removeHeader(header));
		return this;
	}

	public status(status: number): Response {
		this.serverResponse.statusCode = status;
		return this;
	}

	public async text(body: string): Promise<void> {
		return this.send(body, 'text/plain');
	}

	public withoutBody(): this {
		this.omitResponseBody = true;
		return this;
	}

	private parseCookieOptions(name: string, value: number | string, options?: CookieOptions): string {
		const tokens: string[] = [`${name}=${value}`];

		tokens.push(`Path=${options?.path ?? '/'}`);

		if (options?.expires !== undefined) {
			const timestamp = typeof options.expires === 'string'
				? Date.parse(options.expires)
				: options.expires;

			if (!isNaN(timestamp)) {
				tokens.push(`Expires=${new Date(timestamp).toUTCString()}`);
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
		} else {
			tokens.push('SameSite=Lax');
		}

		return tokens.join('; ');
	}
}
