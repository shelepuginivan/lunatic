import { IncomingMessage } from 'http';
import { URL } from 'url';

export class Request {
	public readonly originalUrl: string;
	public readonly query: Record<string, string | string[] | undefined>;
	public body: string | object | undefined;
	public path: string;
	public protocol: string;
	private readonly req: IncomingMessage;
	private requestParameters: Record<string, string | string[]>;

	constructor(req: IncomingMessage) {
		const protocol = 'encrypted' in req.socket ? 'https' : 'http';
		const originalUrl = `${protocol}://${req.headers.host}${req.url}`;
		const { pathname, searchParams } = new URL(originalUrl);
		const query: Record<string, string | string[] | undefined> = {};

		for (const [key, value] of searchParams.entries()) {
			query[key] = value;
		}

		this.body = undefined;
		this.originalUrl = originalUrl;
		this.path = pathname;
		this.protocol = protocol;
		this.req = req;
		this.requestParameters = {};
		this.query = query;
	}

	get method() {
		return this.req.method;
	}

	get headers() {
		return this.req.headers;
	}

	get params() {
		return this.requestParameters;
	}

	set params(params: Record<string, string | string[]>) {
		this.requestParameters = { ...this.requestParameters, ...params };
	}

	on(event: 'data', listener: (chunk: Uint8Array) => void): this;
	on(event: 'end', listener: () => void): this;
	on(event: 'error', listener: (error: Error) => void): this;
	on(event: string, listener: (...args: any[]) => void): this {
		this.req.on(event, listener);
		return this;
	}
}
