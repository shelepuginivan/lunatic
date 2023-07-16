import * as http from 'http';

export class Response {
	constructor(private readonly res: http.ServerResponse) {}

	status(status: number): Response {
		this.res.statusCode = status;

		return this;
	}

	end() {
		this.res.end();
	}
}
