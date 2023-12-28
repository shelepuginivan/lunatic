import { beforeEach, describe, expect, it } from '@jest/globals';

import { LunaticServer } from '../src';

describe('LunaticServer.listen()', () => {
	let app: LunaticServer;

	beforeEach(() => {
		app = new LunaticServer();
	});

	it('Should start server', (done) => {
		app.listen(5124)
			.then(() => expect(app.httpServer.listening).toBe(true))
			.then(() => app.httpServer.close(done));
	});
});
