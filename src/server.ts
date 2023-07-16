import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

import { Request } from './request';
import { Response } from './response';
import { Router } from './router';

export class LunaticServer extends Router {
	private readonly httpServer: Server;

	constructor(httpServer?: Server) {
		super();
		this.httpServer = httpServer ?? createServer();
		this.callback = this.callback.bind(this);
	}

	public callback(req: IncomingMessage, res: ServerResponse): void {
		const request = new Request(req);
		const response = new Response(res);

		super.handle(request, response);

		if (!res.writableEnded) {
			res.statusCode = 404;
			res.end();
		}
	}

	public listen(port: number): Server {
		this.httpServer.on('request', this.callback);
		return this.httpServer.listen(port);
	}
}
