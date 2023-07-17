import { Request } from '../request';
import { Response } from '../response';
import { NextHandler } from './next-handler';

export type RequestHandler = (req: Request, res: Response, next: NextHandler) => unknown
