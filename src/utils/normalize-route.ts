export const normalizeRoute = (route: string) => {
	route = route.trim();

	if (route.at(-1) === '/') {
		route = route.slice(0, -1);
	}

	if (route[0] !== '/') {
		route = `/${route}`;
	}

	return route;
};
