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
	public use(path: string, handler: RequestHandler | Router): this
	public use(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router) {
		return this.addMiddleware('*', arg1, arg2);
	}

	public get(handler: RequestHandler | Router): this
	public get(path: string, handler: RequestHandler | Router): this
	public get(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('GET', arg1, arg2);
	}

	public head(handler: RequestHandler | Router): this
	public head(path: string, handler: RequestHandler | Router): this
	public head(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('HEAD', arg1, arg2);
	}

	public post(handler: RequestHandler | Router): this
	public post(path: string, handler: RequestHandler | Router): this
	public post(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('POST', arg1, arg2);
	}

	public put(handler: RequestHandler | Router): this
	public put(path: string, handler: RequestHandler | Router): this
	public put(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('PUT', arg1, arg2);
	}

	public delete(handler: RequestHandler | Router): this
	public delete(path: string, handler: RequestHandler | Router): this
	public delete(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('DELETE', arg1, arg2);
	}

	public connect(handler: RequestHandler | Router): this
	public connect(path: string, handler: RequestHandler | Router): this
	public connect(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('CONNECT', arg1, arg2);
	}

	public options(handler: RequestHandler | Router): this
	public options(path: string, handler: RequestHandler | Router): this
	public options(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('OPTIONS', arg1, arg2);
	}

	public trace(handler: RequestHandler | Router): this
	public trace(path: string, handler: RequestHandler | Router): this
	public trace(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('TRACE', arg1, arg2);
	}

	public patch(handler: RequestHandler | Router): this
	public patch(path: string, handler: RequestHandler | Router): this
	public patch(arg1: string | RequestHandler | Router, arg2?: RequestHandler | Router): this {
		return this.addMiddleware('PATCH', arg1, arg2);
	}

	protected handle(req: Request, res: Response, next: NextHandler): void {
		let i = 0;

		const nextHandler: NextHandler = () => {
			if (i >= this.middlewares.length) {
				return next();
			}

			const { method, path, handler } = this.middlewares[i];
			i++;

			if (method !== '*' && req.method !== method) {
				return nextHandler();
			}

			const [match, params] = this.matchPaths(req.path, path, handler);

			if (!match) {
				return nextHandler();
			}

			if (handler instanceof Router) {
				const modifiedRequest = Object.assign(Object.create(Object.getPrototypeOf(req)), req);
				modifiedRequest.path = trimPathStart(req.path, path);
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
				path: arg2
			});
		} else if (typeof arg2 !== 'string') {
			this.middlewares.push({
				method,
				handler: arg2,
				path: '*'
			});
		}

		return this;
	}

	private matchPaths(
		requestPath: string,
		path: string,
		handler: RequestHandler | Router
	): [boolean, Record<string, string | string[]>] {
		requestPath = normalizePath(requestPath);
		path = normalizePath(path);

		const params: Record<string, string | string[]> = {};

		if (path === '*') {
			return [true, params];
		}

		if (
			requestPath === '/' && path !== '/' ||
			requestPath !== '/' && path === '/' && !(handler instanceof Router)
		) {
			return [false, params];
		}

		const pathTokens = path.split('/');
		const requestPathTokens = requestPath.split('/');

		while (pathTokens.length && requestPathTokens.length) {
			const pathToken = pathTokens.shift() as string;
			const requestPathToken = requestPathTokens.shift() as string;

			if (pathToken === '' || requestPathToken === '') {
				continue;
			}

			if (pathToken[0] === ':') {
				params[pathToken.substring(1)] = requestPathToken;
			} else if (pathToken.startsWith('...')) {
				const paramLength = requestPathTokens.length - pathTokens.length;
				params[pathToken.substring(3)] = [requestPathToken, ...requestPathTokens.splice(0, paramLength)];
			} else if (pathToken === '*') {
				const paramLength = requestPathTokens.length - pathTokens.length;
				requestPathTokens.splice(0, paramLength);
			} else if (pathToken !== requestPathToken) {
				return [false, params];
			}
		}

		if (handler instanceof Router) {
			return [pathTokens.length === 0, params];
		}

		return [
			!pathTokens.length &&
			!requestPathTokens.length,
			params
		];
	}
}
