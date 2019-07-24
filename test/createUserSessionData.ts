import * as pg from "pg";
import * as _ from "lodash";

/**
 * Create session data for specified user
 * @param pool database Pool
 * @param userName 
 */
export default async function createUserSessionData(
    pool: pg.Pool,
    userName: string
) {
    const result = await pool.query(
        `SELECT * FROM "users" WHERE "name" = $1 LIMIT 1`,
        [userName]
    );

    if (!result || !_.isArray(result.rows) || !result.rows.length) {
        return {
            name: "Unknown User",
            roles: []
        };
    }

    const user = result.rows[0];

    return {
        ...user,
        roles: [
            {
                name: user.role
            }
        ]
    };
}
