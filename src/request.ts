import { IncomingHttpHeaders, IncomingMessage } from 'http';
import { URL } from 'url';

import { HttpMethod } from './types/http-method';
import { UploadedFile } from './types/uploaded-file';

export class Request {
	[name: string]: unknown;

	public readonly incomingMessage: IncomingMessage;
	public readonly originalUrl: string;
	public readonly query: Record<string, string | string[] | undefined>;
	public body: string | Record<string, any> | undefined;
	public cookies: Record<string, string> | undefined;
	public files: Record<string, UploadedFile[]> | undefined;
	public headers: IncomingHttpHeaders;
	public method: HttpMethod;
	public params: Record<string, string | string[]>;
	public path: string;
	public protocol: string;

	constructor(incomingMessage: IncomingMessage) {
		const protocol = 'encrypted' in incomingMessage.socket ? 'https' : 'http';
		const originalUrl = `${protocol}://${incomingMessage.headers.host}${incomingMessage.url}`;
		const { pathname, searchParams } = new URL(originalUrl);
		const query: Record<string, string | string[] | undefined> = {};

		for (const [key, value] of searchParams.entries()) {
			query[key] = value;
		}

		this.body = undefined;
		this.cookies = undefined;
		this.files = undefined;
		this.headers = incomingMessage.headers;
		this.method = incomingMessage.method as HttpMethod | undefined ?? '*';
		this.originalUrl = originalUrl;
		this.params = {};
		this.path = pathname;
		this.protocol = protocol;
		this.incomingMessage = incomingMessage;
		this.query = query;
	}
}
