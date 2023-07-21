export type CookieOptions = {
	domain?: string
	expires?: string | number
	httpOnly?: boolean
	maxAge?: number
	path?: string
} & ({
	sameSite?: 'None'
	secure: true
} | {
	sameSite?: 'Lax' | 'Strict'
	secure?: boolean
});
