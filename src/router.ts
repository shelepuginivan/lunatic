import { Request } from './request';
import { Response } from './response';
import { HttpMethod } from './types/http-method';
import { Middleware } from './types/middleware';

export class Router {
	private readonly middlewares: Middleware[];

	constructor() {
		this.middlewares = [];
	}

	private matchRequest = (req: Request, method: HttpMethod, route: string) => {
		if (req.method !== method) {
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
				req.url = req.url.replace(route, '/')
				handler.handle(req, res);
			} else {
				handler(req, res);
			}
		}
	}
}
