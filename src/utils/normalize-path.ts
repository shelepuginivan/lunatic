export const normalizePath = (path: string) => {
	path = path.trim();

	if (path.at(-1) === '/') {
		path = path.slice(0, -1);
	}

	if (path[0] !== '/') {
		path = `/${path}`;
	}

	return path;
};
