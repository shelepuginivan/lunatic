import { Router } from '../router';
import { HttpMethod } from './http-method';
import { RequestHandler } from './request-handler';

export interface Middleware {
	method: HttpMethod
	route: string
	handler: RequestHandler | Router
}
