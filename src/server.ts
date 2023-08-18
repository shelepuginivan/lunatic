import { createServer, IncomingMessage, Server, ServerResponse } from 'http';

import { Request } from './request';
import { Response } from './response';
import { Router } from './router';
import { ApplicationFeature } from './types/application-feature';
import { RenderFunction } from './types/render-function';

export class LunaticServer extends Router {
	public renderFunction: RenderFunction;
	private readonly enabledFeatures: Set<ApplicationFeature>;
	private readonly httpServer: Server;

	constructor(httpServer?: Server) {
		super();

		this.renderFunction = (source: string) => source;
		this.callback = this.callback.bind(this);
		this.httpServer = httpServer ?? createServer();
		this.enabledFeatures = new Set<ApplicationFeature>([
			'500-on-error',
			'auto-head-handler',
			'x-powered-by'
		]);
	}

	public enable(feature: ApplicationFeature): this {
		this.enabledFeatures.add(feature);
		return this;
	}

	public disable(feature: ApplicationFeature): this {
		this.enabledFeatures.delete(feature);
		return this;
	}

	public toggle(feature: ApplicationFeature): this {
		if (this.enabledFeatures.has(feature)) {
			this.enabledFeatures.delete(feature);
		} else {
			this.enabledFeatures.add(feature);
		}
		return this;
	}

	public callback(req: IncomingMessage, res: ServerResponse): void {
		const request = new Request(req);
		const response = new Response(res, this.renderFunction);

		/**
		 * Treat HEAD requests as GET requests
		 * but omit body of the response.
		 * Enabled by default.
		 */
		if (request.method === 'HEAD' && this.enabledFeatures.has('auto-head-handler')) {
			request.method = 'GET';
			response.withoutBody();
		}

		/**
		 * Sets response header
		 * `X-Powered-By: Lunatic`.
		 * Enabled by default.
		 */
		if (this.enabledFeatures.has('x-powered-by')) {
			response.setHeader('X-Powered-By', 'Lunatic');
		}

		try {
			super.handle(request, response, () => {
				if (!res.writableEnded) {
					res.statusCode = 501;
					res.end();
				}
			});
		} catch (error) {
			if (!this.enabledFeatures.has('500-on-error')) {
				throw error;
			}

			/**
			 * Sends 500 status code
			 * if error occurred.
			 * Enabled by default.
			 */
			if (!res.writableEnded) {
				res.statusCode = 500;
				res.end();
			}
		}
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
