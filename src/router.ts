import { Request } from './request';
import { Response } from './response';
import { HttpMethod } from './types/http-method';
import { Middleware } from './types/middleware';
import { RequestHandler } from './types/request-handler';

export class Router {
	private readonly middlewares: Middleware[];

	constructor() {
		this.middlewares = [];
	}

	private matchRequest = (req: Request, method: HttpMethod, route: string) => {
		if (method !== 'any' && req.method !== method) {
			return false;
		}

		const params: Record<string, string | string[]> = {};

		const routeTokens = route.split('/');
		let urlTokens = req.url.split('/');

		while (routeTokens.length && urlTokens.length) {
			const routeToken = routeTokens.shift() as string;
			const urlToken = urlTokens.shift() as string;

			if (routeToken[0] === ':') {
				params[routeToken.substring(1)] = urlToken;
			} else if (routeToken.startsWith('...')) {
				const paramLength = urlTokens.length - routeTokens.length;
				params[routeToken.substring(3)] = [urlToken, ...urlTokens.slice(0, paramLength)];
				urlTokens = urlTokens.slice(paramLength);
			} else if (routeToken !== urlToken) {
				return false;
			}
		}

		if (routeTokens.length || urlTokens.length) {
			return false;
		}

		req.params = params;
		return true;
	};

	protected handle(req: Request, res: Response) {
		for (let i = 0; i < this.middlewares.length; i++) {
			const { method, route, handler } = this.middlewares[i];

			if (!this.matchRequest(req, method, route)) {
				continue;
			}

			if (handler instanceof Router) {
				req.url = req.url.replace(route, '/');
				handler.handle(req, res);
			} else {
				handler(req, res);
			}
		}
	}

	public use(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'any', route, handler });

		return this;
	}

	public get(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'GET', route, handler });

		return this;
	}

	public head(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'HEAD', route, handler });

		return this;
	}

	public post(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'POST', route, handler });

		return this;
	}

	public put(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'PUT', route, handler });

		return this;
	}

	public delete(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'DELETE', route, handler });

		return this;
	}

	public connect(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'CONNECT', route, handler });

		return this;
	}

	public options(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'OPTIONS', route, handler });

		return this;
	}

	public trace(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'TRACE', route, handler });

		return this;
	}

	public patch(route: string, handler: RequestHandler | Router) {
		this.middlewares.push({ method: 'PATCH', route, handler });

		return this;
	}
}
