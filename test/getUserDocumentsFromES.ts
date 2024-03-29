import * as pg from "pg";
import * as es from "@elastic/elasticsearch";
import * as _ from "lodash";
import fetch from "cross-fetch";
import OpaCompileResponseParser from "opa-compile-response-parser";
import SimpleOpaESTranslator from "./SimpleOpaESTranslator";
import createUserSessionData from "./createUserSessionData";

interface Document {
    name: string;
    owerName: string;
    classificationLevel: number;
}

export default async function getUserDocuments(
    pool: pg.Pool,
    client: es.Client,
    idxName: string,
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

    const ruleResult = parser.evaluate();

    const translator = new SimpleOpaESTranslator(["input.document"]);
    const query = translator.parse(ruleResult);

    const esResult = await client.search({
        index: idxName,
        body: { query }
    });
    if (
        esResult.body &&
        esResult.body.hits &&
        _.isArray(esResult.body.hits.hits) &&
        esResult.body.hits.hits.length
    ) {
        return esResult.body.hits.hits.map((item: any) => item._source);
    }
    return [];
}
