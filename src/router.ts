import { Request } from './request';
import { Response } from './response';
import { HttpMethod } from './types/http-method';
import { Middleware } from './types/middleware';
import { NextHandler } from './types/next-handler';
import { RequestHandler } from './types/request-handler';
import { normalizePath } from './utils/normalize-path';
import { trimPathStart } from './utils/trim-path-start';

export class Router {
	private readonly middlewares: Middleware[];

	constructor() {
		this.middlewares = [];
	}

	public use(handler: RequestHandler | Router): this
	public use(route: string, handler: RequestHandler | Router): this
	public use(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router) {
		return this.addMiddleware('any', arg1, arg2);
	}

	public get(handler: RequestHandler | Router): this
	public get(route: string, handler: RequestHandler | Router): this
	public get(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('GET', arg1, arg2);
	}

	public head(handler: RequestHandler | Router): this
	public head(route: string, handler: RequestHandler | Router): this
	public head(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('HEAD', arg1, arg2);
	}

	public post(handler: RequestHandler | Router): this
	public post(route: string, handler: RequestHandler | Router): this
	public post(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('POST', arg1, arg2);
	}

	public put(handler: RequestHandler | Router): this
	public put(route: string, handler: RequestHandler | Router): this
	public put(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('PUT', arg1, arg2);
	}

	public delete(handler: RequestHandler | Router): this
	public delete(route: string, handler: RequestHandler | Router): this
	public delete(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('DELETE', arg1, arg2);
	}

	public connect(handler: RequestHandler | Router): this
	public connect(route: string, handler: RequestHandler | Router): this
	public connect(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('CONNECT', arg1, arg2);
	}

	public options(handler: RequestHandler | Router): this
	public options(route: string, handler: RequestHandler | Router): this
	public options(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('OPTIONS', arg1, arg2);
	}

	public trace(handler: RequestHandler | Router): this
	public trace(route: string, handler: RequestHandler | Router): this
	public trace(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('TRACE', arg1, arg2);
	}

	public patch(handler: RequestHandler | Router): this
	public patch(route: string, handler: RequestHandler | Router): this
	public patch(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('PATCH', arg1, arg2);
	}

	protected handle(req: Request, res: Response, next: NextHandler): void {
		let i = 0;

		const nextHandler: NextHandler = () => {
			if (i >= this.middlewares.length) {
				return next();
			}

			const { method, route, handler } = this.middlewares[i];
			i++;

			if (method !== 'any' && req.method !== method) {
				return nextHandler();
			}

			const [match, params] = this.matchRequest(req.path, route, handler);

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

	private addMiddleware(
		method: HttpMethod,
		arg2: string | RequestHandler | Router,
		arg3?: RequestHandler | Router
	): this {
		if (typeof arg2 === 'string' && arg3) {
			arg2 = normalizePath(arg2);
			this.middlewares.push({
				method,
				handler: arg3,
				route: arg2
			});
		} else if (typeof arg2 !== 'string') {
			this.middlewares.push({
				method,
				handler: arg2,
				route: '*'
			})
		}

		return this;
	}

	private matchRequest(
		path: string,
		route: string,
		handler: RequestHandler | Router
	): [boolean, Record<string, string | string[]>] {
		path = normalizePath(path);
		route = normalizePath(route);

		const params: Record<string, string | string[]> = {};

		if (route === '*') {
			return [true, params];
		}

		if (
			path === '/' && route !== '/' ||
			path !== '/' && route === '/' && !(handler instanceof Router)
		) {
			return [false, params];
		}

		const routeTokens = route.split('/');
		let urlTokens = path.split('/');

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

		if (handler instanceof Router) {
			return [routeTokens.length === 0, params];
		}

		return [
			!routeTokens.length &&
			!urlTokens.length,
			params
		];
	}
}
