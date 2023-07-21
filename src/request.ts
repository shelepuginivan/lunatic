import { IncomingMessage } from 'http';
import { URL } from 'url';

import { HttpMethod } from './types/http-method';
import { UploadedFile } from './types/uploaded-file';

export class Request {
	[name: string]: unknown;

	public readonly originalUrl: string;
	public readonly query: Record<string, string | string[] | undefined>;
	public body: string | Record<string, any> | undefined;
	public cookies: Record<string, string> | undefined;
	public files: Record<string, UploadedFile[]> | undefined;
	public method: HttpMethod;
	public params: Record<string, string | string[]>;
	public path: string;
	public protocol: string;
	private readonly req: IncomingMessage;

	constructor(req: IncomingMessage) {
		const protocol = 'encrypted' in req.socket ? 'https' : 'http';
		const originalUrl = `${protocol}://${req.headers.host}${req.url}`;
		const { pathname, searchParams } = new URL(originalUrl);
		const query: Record<string, string | string[] | undefined> = {};

		for (const [key, value] of searchParams.entries()) {
			query[key] = value;
		}

		this.body = undefined;
		this.cookies = undefined;
		this.files = undefined;
		this.method = req.method as HttpMethod | undefined ?? 'any';
		this.originalUrl = originalUrl;
		this.params = {};
		this.path = pathname;
		this.protocol = protocol;
		this.req = req;
		this.query = query;
	}

	get headers() {
		return this.req.headers;
	}

	on(event: 'data', listener: (chunk: Uint8Array) => void): this;
	on(event: 'end', listener: () => void): this;
	on(event: 'error', listener: (error: Error) => void): this;
	on(event: string, listener: (...args: any[]) => void): this {
		this.req.on(event, listener);
		return this;
	}
}
