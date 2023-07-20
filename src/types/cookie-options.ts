export interface CookieOptions {
	domain?: string
	expires?: string | number
	httpOnly?: boolean
	maxAge?: number
	path?: string
	sameSite?: 'Lax' | 'None' | 'Strict'
	secure?: boolean
}
