import { Router } from 'express';
import UserRouter from './Users';
import AuthRouter from './Auth';
import StatementRouter from './Statements';

const router = Router();

router.use('/users', UserRouter);
router.use('/auth', AuthRouter);
router.use('/statements', StatementRouter);

export default router;
