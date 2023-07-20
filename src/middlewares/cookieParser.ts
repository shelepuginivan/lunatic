import { RequestHandler } from '../types/request-handler';

export const cookieParser: RequestHandler = (req, _res, next) => {
	const cookieHeader = req.headers.cookie;

	if (!cookieHeader) {
		return next();
	}

	const cookies: Record<string, string> = {};
	const cookieList = cookieHeader.split('; ');

	for (const cookieNameValue of cookieList) {
		const [name, value] = cookieNameValue.trim().split('=');

		cookies[name] = value;
	}

	req.cookies = cookies;
	next();
};
