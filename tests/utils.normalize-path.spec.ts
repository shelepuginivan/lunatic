import { describe, expect, it } from '@jest/globals';

import { normalizePath } from '../src/utils/normalize-path';

describe('utils/normalizeRoute()', () => {
	it('Should remove trailing slash', () => {
		expect(normalizePath('/a/')).toBe('/a');
	});

	it('Should add leading slash', () => {
		expect(normalizePath('a')).toBe('/a');
		expect(normalizePath('some/path')).toBe('/some/path');
	});

	it('Should not modify normalized paths', () => {
		expect(normalizePath('/')).toBe('/');
		expect(normalizePath('/normalized/path')).toBe('/normalized/path');
		expect(normalizePath('/1/2/3/')).toBe('/1/2/3');
	});

	it('Should work with dynamic routes', () => {
		expect(normalizePath('/a/...rest')).toBe('/a/...rest');
		expect(normalizePath('foo/...rest/')).toBe('/foo/...rest');
		expect(normalizePath('/:id')).toBe('/:id');
		expect(normalizePath(':username')).toBe('/:username');
		expect(normalizePath('/a/*')).toBe('/a/*');
		expect(normalizePath('/a/*/')).toBe('/a/*');
	});

	it('Should return / if path is empty', () => {
		expect(normalizePath('')).toEqual('/');
	});
});
