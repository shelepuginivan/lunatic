import * as http from 'http';

export class Request {
	private requestParameters: Record<string, string | string[]>;
	public readonly originalUrl: string;
	public body: string | object | undefined;

	constructor(private readonly req: http.IncomingMessage) {
		this.requestParameters = {};
		this.originalUrl = req.url as string;
		this.body = undefined;
	}

	get method() {
		return this.req.method;
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

	get params() {
		return this.requestParameters;
	}

	set params(params: Record<string, string | string[]>) {
		this.requestParameters = { ...this.requestParameters, ...params };
	}

	get url() {
		return this.req.url as string;
	}

	set url(url: string) {
		this.req.url = url;
	}
}
