import * as pg from "pg";
import * as _ from "lodash";
import * as request from "request-promise-native";
import OpaCompileResponseParser from "opa-compile-response-parser";
import SimpleOpaSQLTranslator from "./SimpleOpaSQLTranslator";
import createUserSessionData from "./createUserSessionData";

interface Document {
    name: string;
    owerName: string;
    classificationLevel: number;
}

export default async function getUserDocuments(
    pool: pg.Pool,
    userName: string
): Promise<Document[]> {
    const userData = await createUserSessionData(pool, userName);
    const res = await request(`http://localhost:8181/v1/compile`, {
        method: "post",
        json: {
            query: "data.object.document.allow == true",
            input: {
                user: userData
            },
            unknowns: ["input.document"]
        }
    });

    const parser = new OpaCompileResponseParser();
    parser.parse(res);

    const sqlValues: any[] = [];
    const translator = new SimpleOpaSQLTranslator(["input.document"]);
    const sqlClause = translator.parse(parser.evaluate(), sqlValues);

    const result = await pool.query(
        `SELECT * FROM documents ${sqlClause ? `WHERE ${sqlClause}` : ""}`,
        sqlValues
    );

    if (!result || !_.isArray(result.rows) || !result.rows.length) {
        return [];
    }

    return result.rows;
}
