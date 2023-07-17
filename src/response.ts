import * as http from 'http';

export class Response {
	constructor(private readonly res: http.ServerResponse) {}

	public end() {
		this.res.end();
	}

	public json(body: object) {
		this.res.setHeader('Content-Type', 'application/json');
		this.res.end(JSON.stringify(body));
	}

	public setHeader(name: string, value: number | string | string[]) {
		this.res.setHeader(name, value);
	}

	public setHeaders(headers: Record<string, number | string | string[]>) {
		for (const name in headers) {
			this.res.setHeader(name, headers[name]);
		}
	}

	public status(status: number): Response {
		this.res.statusCode = status;
		return this;
	}

	public text(body: string) {
		this.setHeader('Content-Type', 'text/plain');
		this.res.end(body);
	}
}
