import { RequestHandler } from '../types/request-handler';

export const bodyParser: RequestHandler = (req, _res, next) => {
	const contentType = req.headers['content-type'];

	if (
		!contentType?.startsWith('application/json') &&
		!contentType?.startsWith('text/plain')
	) {
		return next();
	}

	const chunks: Uint8Array[] = [];

	req.incomingMessage
		.on('data', (chunk) => chunks.push(chunk))
		.on('end', () => {
			let body: string | Record<string, any> = Buffer.concat(chunks).toString();

			if (contentType === 'application/json') {
				body = JSON.parse(body);
			}

			req.body = body;
			next();
		});
};
