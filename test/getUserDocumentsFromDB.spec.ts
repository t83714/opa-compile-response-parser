import "mocha";
import * as pg from "pg";
import * as _ from "lodash";
import * as chai from "chai";
import * as chaiAsPromised from "chai-as-promised";
import getUserDocumentsFromDB from "./getUserDocumentsFromDB";
import getTestDBConfig from "./getTestDBConfig";
import runMigrationSql, { deleteAllTables } from "./runMigrationSql";

chai.use(chaiAsPromised);
const { expect } = chai;

describe("Test getUserDocumentsFromDB", function(this: Mocha.ISuiteCallbackContext) {
    this.timeout(10000);
    let pool: pg.Pool = null;
    const dbConfig = getTestDBConfig();

    async function buildInitDb() {
        // --- rebuilt the schema
        await runMigrationSql(pool, true);
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
        await buildInitDb();
    });

    after(async function() {
        if (pool) {
            await deleteAllTables(pool);
            pool.end();
            pool = null;
        }
    });

    it("Should allow user1 to access all documents", async () => {
        const documents = await getUserDocumentsFromDB(pool, "user1");
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
        const documents = await getUserDocumentsFromDB(pool, "user2");
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
        const documents = await getUserDocumentsFromDB(pool, "user3");
        expect(documents.length).to.equal(1);
        const documentNames = documents.map(doc => doc.name);
        expect(documentNames).to.have.members(["doc31"]);
    });

    it("Should not allow user4 to any documents", async () => {
        const documents = await getUserDocumentsFromDB(pool, "user4");
        expect(documents.length).to.equal(0);
    });

    it("Should not allow user5 to any documents", async () => {
        const documents = await getUserDocumentsFromDB(pool, "user5");
        expect(documents.length).to.equal(0);
    });

    it("Should not allow user6 to any documents except doc51", async () => {
        const documents = await getUserDocumentsFromDB(
            pool,
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
        const documents = await getUserDocumentsFromDB(
            pool,
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
