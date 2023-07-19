import { normalizeRoute } from './normalize-route';

export const trimPathStart = (path: string, pathStart: string) => {
	path = normalizeRoute(path);
	pathStart = normalizeRoute(pathStart);

	if (pathStart === '/') {
		return path;
	}

	const pathStartLength = pathStart.split('/').length;
	const pathTokens = path.split('/');

	return normalizeRoute(pathTokens.slice(pathStartLength).join('/'));
};
