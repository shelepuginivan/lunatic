import { Request } from './request';
import { Response } from './response';
import { HttpMethod } from './types/http-method';
import { Middleware } from './types/middleware';
import { NextHandler } from './types/next-handler';
import { RequestHandler } from './types/request-handler';
import { normalizeRoute } from './utils/normalize-route';

export class Router {
	private readonly middlewares: Middleware[];

	constructor() {
		this.middlewares = [];
	}

	public use(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('any', route, handler);
	}

	public get(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('GET', route, handler);
	}

	public head(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('HEAD', route, handler);
	}

	public post(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('POST', route, handler);
	}

	public put(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('PUT', route, handler);
	}

	public delete(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('DELETE', route, handler);
	}

	public connect(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('CONNECT', route, handler);
	}

	public options(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('OPTIONS', route, handler);
	}

	public trace(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('TRACE', route, handler);
	}

	public patch(route: string, handler: RequestHandler | Router): this {
		return this.addMiddleware('PATCH', route, handler);
	}


	protected handle(req: Request, res: Response, next: NextHandler) {
		let i = 0;

		const nextHandler: NextHandler = () => {
			if (i >= this.middlewares.length) {
				return next();
			}

			const { method, route, handler } = this.middlewares[i];
			i++;

			if (!this.matchRequest(req, method, route, handler)) {
				return nextHandler();
			}

			if (handler instanceof Router) {
				/** Remove first part of request path to match it with nested middlewares
				 *  e.g. /user/profile => /profile
				 */
				const urlInThisRouter = req.path;
				req.path = normalizeRoute(req.path.replace(/\/[^/]*/, ''));
				handler.handle(req, res, nextHandler);
				req.path = urlInThisRouter;
			} else {
				handler(req, res, nextHandler);
			}
		};

		nextHandler();
	}

	private addMiddleware(method: HttpMethod, route: string, handler: RequestHandler | Router): this {
		route = normalizeRoute(route);
		this.middlewares.push({ method, route, handler });
		return this;
	}

	private matchRequest(
		req: Request,
		method: HttpMethod,
		route: string,
		handler: RequestHandler | Router
	) {
		route = normalizeRoute(route);

		if (method !== 'any' && req.method !== method) {
			return false;
		}

		const params: Record<string, string | string[]> = {};

		const routeTokens = route.split('/');
		let urlTokens = req.path.split('/');

		while (routeTokens.length && urlTokens.length) {
			const routeToken = routeTokens.shift() as string;
			const urlToken = urlTokens.shift() as string;

			if (routeToken[0] === ':') {
				params[routeToken.substring(1)] = urlToken;
			} else if (routeToken.startsWith('...')) {
				const paramLength = urlTokens.length - routeTokens.length;
				params[routeToken.substring(3)] = [urlToken, ...urlTokens.slice(0, paramLength)];
				urlTokens = urlTokens.slice(paramLength);
			} else if (routeToken === '*') {
				const paramLength = urlTokens.length - routeTokens.length;
				urlTokens = urlTokens.slice(paramLength);
			} else if (routeToken !== urlToken) {
				return false;
			}
		}

		if (handler instanceof Router) {
			req.params = params;
			return true;
		}

		if (routeTokens.length || urlTokens.length) {
			return false;
		}

		req.params = params;
		return true;
	}
}
