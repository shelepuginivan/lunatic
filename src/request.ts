import * as http from 'http';

export class Request {
	constructor(private readonly req: http.IncomingMessage) {}
}
