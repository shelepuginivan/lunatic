import { Request } from '../request';
import { Response } from '../response';
import { NextHandler } from '../types/next-handler';
import { RequestHandler } from '../types/request-handler';

export const bodyParser: RequestHandler = (req: Request, _res: Response, next: NextHandler) => {
	const chunks: Uint8Array[] = [];

	req.on('data', (chunk) => {
		chunks.push(chunk);
	}).on('end', () => {
		let body: string | object = Buffer.concat(chunks).toString();

		if (req.headers['content-type'] === 'application/json') {
			body = JSON.parse(body);
		}

		req.body = body;
		next()
	});
};
