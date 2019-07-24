import "mocha";
import * as pg from "pg";
import * as es from "@elastic/elasticsearch";
import * as _ from "lodash";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import getUserDocumentsFromES from "./getUserDocumentsFromES";
import getTestDBConfig from "./getTestDBConfig";
import runMigrationSql, { deleteAllTables } from "./runMigrationSql";

chai.use(chaiAsPromised);
const { expect } = chai;
const esClient = new es.Client({ node: "http://localhost:9200" });
const idxName = "document_test";
const testDocuments = [
    {
        name: "doc11",
        ownerName: "none",
        classificationLevel: 1
    },
    {
        name: "doc21",
        ownerName: "none",
        classificationLevel: 6
    },
    {
        name: "doc31",
        ownerName: "user3",
        classificationLevel: 3
    },
    {
        name: "doc32",
        ownerName: "user3",
        classificationLevel: 4
    },
    {
        name: "doc41",
        ownerName: "user4",
        classificationLevel: 4
    },
    {
        name: "doc42",
        ownerName: "user4",
        classificationLevel: 5
    },
    {
        name: "doc51",
        ownerName: "none",
        classificationLevel: 10
    }
];

describe("Test getUserDocumentsFromES", function(this: Mocha.ISuiteCallbackContext) {
    this.timeout(10000);
    let pool: pg.Pool = null;
    const dbConfig = getTestDBConfig();

    async function buildInitDb() {
        // --- rebuilt the schema
        await runMigrationSql(pool, true);
        // --- start re-build test es document index
        await esClient.indices.delete({
            index: idxName,
            ignore_unavailable: true
        });
        await esClient.indices.refresh({
            index: "_all"
        });

        await esClient.indices.create({
            index: idxName,
            body: {
                mappings: {
                    _doc: {
                        properties: {
                            name: { type: "keyword" },
                            ownerName: { type: "keyword" },
                            classificationLevel: { type: "integer" }
                        }
                    }
                }
            }
        });

        await esClient.bulk({
            index: idxName,
            type: "_doc",
            refresh: "wait_for",
            body:
                testDocuments
                    .map(item => {
                        const op = {
                            index: { _index: idxName, _id: item.name }
                        };
                        return JSON.stringify(op) + "\n" + JSON.stringify(item);
                    })
                    .join("\n") + "\n"
        });
    }

    before(async function() {
        // --- you have to supply a db name to connect to pg
        pool = new pg.Pool({ ...dbConfig });
        try {
            await pool.query("CREATE database test");
        } catch (e) {
            // --- if database `test` already there
            // --- then mute the error
            if (e.code !== "42P04") {
                throw e;
            }
        }
        // --- end the current one & create a new one
        await pool.end();
        pool = new pg.Pool({ ...dbConfig, database: "test" });
        try {
            await buildInitDb();
        } catch (e) {
            console.log(e);
            throw e;
        }
    });

    after(async function() {
        if (pool) {
            await deleteAllTables(pool);
            pool.end();
            pool = null;
        }
    });

    it("Should allow user1 to access all documents", async () => {
        const documents = await getUserDocumentsFromES(
            pool,
            esClient,
            idxName,
            "user1"
        );
    
        expect(documents.length).to.equal(7);
        const documentNames = documents.map(doc => doc.name);
        expect(documentNames).to.have.members([
            "doc11",
            "doc21",
            "doc31",
            "doc32",
            "doc41",
            "doc42",
            "doc51"
        ]);
    });

    it("Should allow user2 to access all documents", async () => {
        const documents = await getUserDocumentsFromES(
            pool,
            esClient,
            idxName,
            "user2"
        );
        expect(documents.length).to.equal(7);
        const documentNames = documents.map(doc => doc.name);
        expect(documentNames).to.have.members([
            "doc11",
            "doc21",
            "doc31",
            "doc32",
            "doc41",
            "doc42",
            "doc51"
        ]);
    });

    it("Should allow user3 to access doc31 Only", async () => {
        const documents = await getUserDocumentsFromES(
            pool,
            esClient,
            idxName,
            "user3"
        );
        expect(documents.length).to.equal(1);
        const documentNames = documents.map(doc => doc.name);
        expect(documentNames).to.have.members(["doc31"]);
    });

    it("Should not allow user4 to any documents", async () => {
        const documents = await getUserDocumentsFromES(
            pool,
            esClient,
            idxName,
            "user4"
        );
        expect(documents.length).to.equal(0);
    });

    it("Should not allow user5 to any documents", async () => {
        const documents = await getUserDocumentsFromES(
            pool,
            esClient,
            idxName,
            "user5"
        );
        expect(documents.length).to.equal(0);
    });

    it("Should not allow user6 to any documents except doc51", async () => {
        const documents = await getUserDocumentsFromES(
            pool,
            esClient,
            idxName,
            "user6"
        );
        expect(documents.length).to.equal(6);
        const documentNames = documents.map(doc => doc.name);
        expect(documentNames).to.have.members([
            "doc11",
            "doc21",
            "doc31",
            "doc32",
            "doc41",
            "doc42"
        ]);
    });

    it("Should not allow user7 to any documents except doc51", async () => {
        const documents = await getUserDocumentsFromES(
            pool,
            esClient,
            idxName,
            "user7"
        );
        expect(documents.length).to.equal(6);
        const documentNames = documents.map(doc => doc.name);
        expect(documentNames).to.have.members([
            "doc11",
            "doc21",
            "doc31",
            "doc32",
            "doc41",
            "doc42"
        ]);
    });
});
