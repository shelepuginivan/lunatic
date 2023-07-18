import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

import { Request } from './request';
import { Response } from './response';
import { Router } from './router';
import { RenderFunction } from './types/render-function';

export class LunaticServer extends Router {
	public renderFunction: RenderFunction;
	private readonly httpServer: Server;

	constructor(httpServer?: Server) {
		super();
		this.httpServer = httpServer ?? createServer();
		this.renderFunction = (source: string) => source;
		this.callback = this.callback.bind(this);
	}

	public callback(req: IncomingMessage, res: ServerResponse): void {
		const request = new Request(req);
		const response = new Response(res, this.renderFunction);

		super.handle(request, response, () => {
			if (!res.writableEnded) {
				res.statusCode = 404;
				res.end();
			}
		});
	}

	public listen(port: number): Server {
		this.httpServer.on('request', this.callback);
		return this.httpServer.listen(port);
	}

	public renderer(renderFunction: RenderFunction): this {
		this.renderFunction = renderFunction;
		return this;
	}
}
