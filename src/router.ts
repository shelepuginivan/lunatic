import { Request } from './request';
import { Response } from './response';
import { HttpMethod } from './types/http-method';
import { Middleware } from './types/middleware';
import { NextHandler } from './types/next-handler';
import { RequestHandler } from './types/request-handler';
import { normalizeRoute } from './utils/normalize-route';
import { trimPathStart } from './utils/trimPathStart';

export class Router {
	private readonly middlewares: Middleware[];

	constructor() {
		this.middlewares = [];
	}

	public use(handler: RequestHandler | Router): this
	public use(route: string, handler: RequestHandler | Router): this
	public use(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router) {
		if (typeof arg1 === 'string' && arg2) {
			return this.addMiddleware('any', arg1, arg2);
		}

		if (typeof arg1 !== 'string') {
			return this.addMiddleware('any', '*', arg1);
		}

		return this;
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


	protected handle(req: Request, res: Response, next: NextHandler): void {
		let i = 0;

		const nextHandler: NextHandler = () => {
			if (i >= this.middlewares.length) {
				return next();
			}

			const { method, route, handler } = this.middlewares[i];
			i++;

			const [match, params] = this.matchRequest(req, method, route, handler);

			if (!match) {
				return nextHandler();
			}

			if (handler instanceof Router) {
				const modifiedRequest = Object.assign(Object.create(Object.getPrototypeOf(req)), req);
				modifiedRequest.path = trimPathStart(req.path, route);
				modifiedRequest.params = { ...req.params, ...params };

				handler.handle(modifiedRequest, res, nextHandler);
			} else {
				req.params = { ...req.params, ...params };
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
	): [boolean, Record<string, string | string[]>] {
		route = normalizeRoute(route);
		const params: Record<string, string | string[]> = {};

		if (method !== 'any' && req.method !== method) {
			return [false, params];
		}

		const routeTokens = route.split('/');
		let urlTokens = req.path.split('/');

		while (routeTokens.length && urlTokens.length) {
			const routeToken = routeTokens.shift() as string;
			const urlToken = urlTokens.shift() as string;

			if (routeToken === '' || urlToken === '') {
				continue;
			}

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
				return [false, params];
			}
		}

		return [
			handler instanceof Router ||
			!routeTokens.length &&
			!urlTokens.length,
			params
		];
	}
}
