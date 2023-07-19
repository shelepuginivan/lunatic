import { normalizePath } from './normalize-path';

export const trimPathStart = (path: string, pathStart: string) => {
	path = normalizePath(path);
	pathStart = normalizePath(pathStart);

	if (pathStart === '/') {
		return path;
	}

	const pathStartLength = pathStart.split('/').length;
	const pathTokens = path.split('/');

	return normalizePath(pathTokens.slice(pathStartLength).join('/'));
};
