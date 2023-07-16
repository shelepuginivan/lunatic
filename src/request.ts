import * as http from 'http';

export class Request {
	private requestParameters: Record<string, string | string[]>

	constructor(private readonly req: http.IncomingMessage) {
		this.requestParameters = {};
	}

	get method() {
		return this.req.method;
	}

	get params() {
		return this.requestParameters;
	}

	set params(params: Record<string, string | string[]>) {
		this.requestParameters = params
	}

	get url() {
		return this.req.url as string;
	}

	set url(url: string) {
		this.req.url = url;
	}
}