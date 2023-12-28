import { describe, expect, it } from '@jest/globals';
import { Server } from 'http';

import { LunaticServer } from '../src';

describe('LunaticServer', () => {
	it('Should be able to be used with custom servers', (done) => {
		const server = new Server();
		const app = new LunaticServer(server);

		app.listen(8000, undefined, undefined)
			.then(() => expect(server.listening).toBe(true))
			.then(() => server.close(done))
	});
});
