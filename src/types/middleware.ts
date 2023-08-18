import { Router } from '../router';
import { HttpMethod } from './http-method';
import { RequestHandler } from './request-handler';

export interface Middleware {
	method: HttpMethod
	path: string
	handler: RequestHandler | Router
}
