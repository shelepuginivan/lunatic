import { beforeEach, describe, expect, it } from '@jest/globals';

import { LunaticServer } from '../src';

describe('LunaticServer.listen()', () => {
	let app: LunaticServer;

	beforeEach(() => {
		app = new LunaticServer()
	});

	it('Should start server', (done) => {
		const server = app.listen(5124);

		expect(server.listening).toBe(true);
		server.close(done);
	});
});
