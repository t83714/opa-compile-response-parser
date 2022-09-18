import * as pg from "pg";
import * as _ from "lodash";
import fetch from "cross-fetch";
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
    const res = await fetch(`http://localhost:8181/v1/compile`, {
        method: "post",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            query: "data.object.document.allow == true",
            input: {
                user: userData
            },
            unknowns: ["input.document"]
        })
    });

    const parser = new OpaCompileResponseParser();
    parser.parse(await res.json());

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
