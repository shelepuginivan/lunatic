import { Router } from '../router';
import { CorsOptions } from '../types/cors-options';
import { HttpMethod } from '../types/http-method';

export const cors = (options?: CorsOptions) => {
	const accessControlAllowCredentials = (
		allowedOrigins: boolean | string | string[] | RegExp | RegExp[] | ((origin: string) => boolean) | undefined,
		credentials: boolean
	): Record<string, string> => {
		if (allowedOrigins === '*' || allowedOrigins === true || !credentials) {
			return {};
		}

		return { 'Access-Control-Allow-Credentials': 'true' };
	};

	const accessControlAllowHeaders = (headers?: string | string[]): Record<string, string> => {
		if (!headers) {
			return {};
		}

		const headerValue = typeof headers === 'string'
			? headers
			: headers.join(',');

		return { 'Access-Control-Allow-Headers': headerValue };
	};

	const accessControlAllowMethods = (methods?: HttpMethod | HttpMethod[]): Record<string, string> => {
		if (methods === undefined) {
			return { 'Access-Control-Allow-Methods': '*' };
		}

		const headerValue = typeof methods === 'string'
			? methods
			: methods.join(',');

		return { 'Access-Control-Allow-Methods': headerValue };
	};

	const accessControlAllowOrigin = (
		origin: string,
		allowedOrigins: boolean | string | string[] | RegExp | RegExp[] | ((origin: string) => boolean) | undefined
	): Record<string, string> => {
		if (allowedOrigins === '*' || allowedOrigins === true || allowedOrigins === undefined) {
			return {
				Vary: 'Origin',
				'Access-Control-Allow-Origin': '*'
			};
		}

		return { 'Access-Control-Allow-Origin': origin };
	};

	const accessControlExposeHeaders = (headers?: string | string[]): Record<string, string> => {
		if (!headers) {
			return {};
		}

		const headerValue = typeof headers === 'string'
			? headers
			: headers.join(',');

		return { 'Access-Control-Expose-Headers': headerValue };
	};

	const accessControlMaxAge = (maxAge?: number): Record<string, string> => {
		if (maxAge === undefined) {
			return {};
		}

		return { 'Access-Control-Max-Age': String(maxAge) };
	};

	const matchOrigin = (
		requestOrigin: string,
		allowedOrigin?: boolean | string | string[] | RegExp | RegExp[] | ((origin: string) => boolean)
	): boolean => {
		if (allowedOrigin === undefined || allowedOrigin === '*') {
			return true;
		}

		if (typeof allowedOrigin === 'boolean') {
			return allowedOrigin;
		}

		if (typeof allowedOrigin === 'string') {
			return allowedOrigin === requestOrigin;
		}

		if (typeof allowedOrigin === 'function') {
			return allowedOrigin(requestOrigin);
		}

		if (allowedOrigin instanceof RegExp) {
			return allowedOrigin.test(requestOrigin);
		}

		return allowedOrigin.some(origin =>
			typeof origin === 'string'
				? origin === requestOrigin
				: origin.test(requestOrigin)
		);
	};

	const {
		allowedHeaders,
		credentials = false,
		corsErrorStatus = 403,
		exposedHeaders,
		maxAge,
		methods,
		origin,
		preflightSuccessStatus = 204
	} = options ?? {};

	return new Router()
		.options(async (req, res) => {
			const requestOrigin = req.headers.origin;

			if (!requestOrigin || origin === false || !matchOrigin(requestOrigin, origin)) {
				return await res.status(corsErrorStatus).end();
			}

			await res
				.status(preflightSuccessStatus)
				.setHeaders({
					...accessControlAllowCredentials(origin, credentials),
					...accessControlAllowMethods(methods),
					...accessControlAllowHeaders(allowedHeaders),
					...accessControlAllowOrigin(requestOrigin, origin),
					...accessControlMaxAge(maxAge)
				})
				.end();
		})
		.use(async (req, res, next) => {
			const requestOrigin = req.headers.origin;
			const requestMethod = req.method;

			if (!requestOrigin) {
				return next();
			}

			if (
				!matchOrigin(requestOrigin, origin) ||
				typeof methods === 'string' && requestMethod !== methods ||
				!requestMethod.includes(requestMethod)
			) {
				return await res.status(corsErrorStatus).end();
			}

			res.setHeaders({
				...accessControlAllowCredentials(origin, credentials),
				...accessControlAllowMethods(methods),
				...accessControlAllowOrigin(requestOrigin, origin),
				...accessControlExposeHeaders(exposedHeaders)
			});

			next();
		});
};
