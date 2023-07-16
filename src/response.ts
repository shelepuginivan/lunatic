import * as http from 'http';

export class Response {
	constructor(private readonly res: http.ServerResponse) {}
}
