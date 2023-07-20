import { RequestHandler } from '../types/request-handler';
import { UploadedFile } from '../types/uploaded-file';
import { CRLF } from '../utils/constants';

export const formParser: RequestHandler = (req, _res, next) => {
	const contentTypeHeader = req.headers['content-type'];

	if (!contentTypeHeader || !contentTypeHeader.startsWith('multipart/form-data')) {
		return next();
	}

	const boundaryString = contentTypeHeader.split(';')[1].trim();
	const boundary = boundaryString.split('=')[1];

	const chunks: Uint8Array[] = [];

	req
		.on('data', (chunk) => chunks.push(chunk))
		.on('end', () => parseFormData());

	const parseFormData = () => {
		const formDataString = Buffer.concat(chunks).toString();
		const formParts = formDataString.split(`--${boundary}`);

		formParts.shift();
		formParts.pop();

		const body: Record<string, string> = {};
		const files: Record<string, UploadedFile[]> = {};

		formParts.forEach((part: string) => {
			const [headers, content] = part.split(`${CRLF}${CRLF}`);
			const [, contentDispositionHeader, contentTypeHeader] = headers.split(CRLF);

			const [
				fieldNameInQuotes,
				filenameInQuotes
			] = contentDispositionHeader.match(/".*?"/g) as RegExpMatchArray;
			const mimetype = contentTypeHeader?.split(': ')[1].trim();
			const fieldName = fieldNameInQuotes.slice(1, -1);
			const filename = filenameInQuotes?.slice(1, -1);

			if (!filename || !mimetype) {
				body[fieldName] = content.trim();
				return;
			}

			const uploadedFile = {
				data: Buffer.from(content.slice(0, -2)),	// trim trailing CRLF
				filename,
				mimetype
			};

			if (fieldName in files) {
				files[fieldName].push(uploadedFile);
			} else {
				files[fieldName] = [uploadedFile];
			}
		});

		req.body = body;
		req.files = files;
		next();
	};
};
