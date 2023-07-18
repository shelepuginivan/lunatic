import { RequestHandler } from '../types/request-handler';

export const bodyParser: RequestHandler = (req, _res, next) => {
	const contentType = req.headers['content-type'];

	if (contentType !== 'application/json' || contentType !== 'text/plain') {
		return next();
	}

	const chunks: Uint8Array[] = [];

	req
		.on('data', (chunk) => chunks.push(chunk))
		.on('end', () => {
			let body: string | object = Buffer.concat(chunks).toString();

			if (contentType === 'application/json') {
				body = JSON.parse(body);
			}

			req.body = body;
			next();
		});
};
