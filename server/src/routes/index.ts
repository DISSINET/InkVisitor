import { Router } from 'express';
import UserRouter from './Users';
import AuthRouter from './Auth';
import StatementRouter from './Statements';

import cors from "cors";

const router = Router();

router.use(cors());
router.use('/users', UserRouter);
router.use('/auth', AuthRouter);
router.use('/statements', StatementRouter);

export default router;
