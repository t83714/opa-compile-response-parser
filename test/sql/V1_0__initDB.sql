CREATE TABLE "public"."users" (
    "name" varchar(250) NOT NULL DEFAULT ''::character varying,
    "role" varchar(250) NOT NULL DEFAULT ''::character varying,
    "accessLevel" int4 NOT NULL DEFAULT 0, 
    PRIMARY KEY ("name")
);


CREATE TABLE "public"."documents" (
    "name" varchar(250) NOT NULL DEFAULT ''::character varying,
    "ownerName" varchar(250) NOT NULL DEFAULT ''::character varying,
    "classificationLevel" int4 NOT NULL DEFAULT 0, 
    PRIMARY KEY ("name")
);


INSERT INTO "public"."documents" ("name", "ownerName", "classificationLevel") VALUES 
('doc11', 'none', '1'),
('doc21', 'none', '6'),
('doc31', 'user3', '3'),
('doc32', 'user3', '4'),
('doc41', 'user4', '4'),
('doc42', 'user4', '5'),
('doc51', 'none', '10');

INSERT INTO "public"."users" ("name", "role", "accessLevel") VALUES 
('user1', 'admin', '-1'),
('user2', 'admin', '5'),
('user3', 'document readers', '-1'),
('user4', 'document readers', '4'),
('user5', 'anonymous users', '-1'),
('user6', 'document power readers', '-1'),
('user7', 'document power readers', '4');

