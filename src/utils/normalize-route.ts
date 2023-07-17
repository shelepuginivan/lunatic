export const normalizeRoute = (route: string) => {
	route = route.trim();

	if (route[0] !== '/') {
		route = `/${route}`;
	}

	if (route.at(-1) === '/') {
		route = route.slice(0, -1);
	}

	return route;
};
