
import { rethinkConfig } from '@service/RethinkDB';
import { Response } from "express"
import { r } from "rethinkdb-ts"

//-----------------------------------------------------------------------------
//  Repository function generator
//-----------------------------------------------------------------------------
export const getOneActant = async (id: string, category: string | null = null): Promise<any> => {
    const conn = await r.connect(rethinkConfig)
    const predicate = category != null ? { "class": category, "id": id } : { "id": id };
    return await r.table('actants').filter(predicate).run(conn);
}

//-----------------------------------------------------------------------------
// Controller functions
//-----------------------------------------------------------------------------

/**
 * Get the HTTP status code and JSON result.
 */
export const Result = (
    response: Response,
    code: number,
    message: string | any | any[] //IEntity | IEntity[] | string
) => {
    return response.status(code).json(message);
}
