import * as http from 'http';

export class Request {
	private requestParameters: Record<string, string | string[]>;
	public readonly originalUrl: string;

	constructor(private readonly req: http.IncomingMessage) {
		this.requestParameters = {};
		this.originalUrl = req.url as string;
	}

	get method() {
		return this.req.method;
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
