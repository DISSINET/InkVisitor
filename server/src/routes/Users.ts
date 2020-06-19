import { Request, Response, Router } from 'express';
import { BAD_REQUEST, CREATED, OK } from 'http-status-codes';
import { ParamsDictionary } from 'express-serve-static-core';

import UserDao from '@daos/User/UserDao.mock';
import { paramMissingError } from '@shared/constants';
import { adminMW } from './middleware';
import { UserRoles } from '@entities/User';

const router = Router().use(adminMW);
const userDao = new UserDao();

/** 
 * Get the entity `GET /api/users/`. 
 */
router.get('/', async (req: Request, res: Response) => {
    const users = await userDao.getAll();
    return res.status(OK).json({ users });
});

/** 
 * Create the entity `POST /api/users`.
 */
router.post('/', async (req: Request, res: Response) => {
    // Check the parameters.
    const { user } = req.body;
    if (!user) {
        return res.status(BAD_REQUEST).json({
            error: paramMissingError,
        });
    }
    // Create new user.
    user.role = UserRoles.Standard;
    await userDao.add(user);
    return res.status(CREATED).end();
});

/**
 * Update the entity `PUT /api/users`.
 */
router.put('/', async (req: Request, res: Response) => {
    // Check Parameters
    const { user } = req.body;
    if (!user) {
        return res.status(BAD_REQUEST).json({
            error: paramMissingError,
        });
    }
    // Update user
    user.id = Number(user.id);
    await userDao.update(user);
    return res.status(OK).end();
});

/** 
 * Delete the entity `DELETE /api/users/:id`.
 */
router.delete('/:id', async (req: Request, res: Response) => {
    const { id } = req.params as ParamsDictionary;
    await userDao.delete(Number(id));
    return res.status(OK).end();
});

export default router;
