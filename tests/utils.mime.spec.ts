import { describe, expect, it } from '@jest/globals';

import { Mime } from '../src/utils/mime';

describe('utils/Mime', () => {
	it('Should return some popular MIME-types by extension', () => {
		const extensions: Record<string, string> = {
			'.html': 'text/html',
			'.json': 'application/json',
			'.png': 'image/png',
			'.jpg': 'image/jpeg',
			'.jpeg': 'image/jpeg',
			'.txt': 'text/plain',
			'.xml': 'application/xml'
		};

		for (const ext in extensions) {
			const expectedType = extensions[ext];
			const type = Mime.get(ext);

			expect(type).toBe(expectedType);
		}
	});

	it('Should return "application/octet-stream" if if the corresponding extension is not found', () => {
		const unknownExtensions = ['.xyz', '.mno', '.dct', '.lmn', '.kpx', '.pqr', '.jkl', '.vwx', '.zyx'];

		unknownExtensions.forEach(ext => {
			expect(Mime.get(ext)).toBe('application/octet-stream');
		});
	});

	it('Should return "application/octet-stream" if provided extension is not a string', () => {
		expect(Mime.get(undefined)).toBe('application/octet-stream');
		expect(Mime.get(null)).toBe('application/octet-stream');
		expect(Mime.get(true)).toBe('application/octet-stream');
		expect(Mime.get(9)).toBe('application/octet-stream');
		expect(Mime.get({})).toBe('application/octet-stream');
	});

	it('Should return "application/octet-stream" extension was not provided', () => {
		expect(Mime.get.call(Mime, [])).toBe('application/octet-stream');
	});
});
