import { HttpMethod } from './http-method';

export interface CorsOptions {
	allowedHeaders?: string | string[]
	corsErrorStatus?: number
	credentials?: boolean
	exposedHeaders?: string | string[]
	maxAge?: number
	methods?: HttpMethod | HttpMethod[]
	origin?: | boolean | string | string[] | RegExp | RegExp[] | ((origin: string) => boolean)
	preflightSuccessStatus?: number
}
