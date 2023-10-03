import { describe, expect, it } from '@jest/globals';

import { trimPathStart } from '../src/utils/trim-path-start';

describe('utils/trimPathStart()', () => {
	it('Should trim path start', () => {
		expect(trimPathStart('/api/posts/recent', '/api')).toBe('/posts/recent');
		expect(trimPathStart('/api/posts', '/')).toBe('/api/posts');
		expect(trimPathStart('/1/2/3/4/5/6', '/1/2/3/4')).toBe('/5/6');
		expect(trimPathStart('1/2/3/4', '/')).toBe('/1/2/3/4');
		expect(trimPathStart('/', '/a/b/c/d')).toBe('/');
		expect(
			trimPathStart('/username/article/3809842093', '/928347203847')
		).toBe('/article/3809842093');
	});
});
