package object.document

test_document_access_class_level_higher_than_3 {
    not allow with input as {
        "user": {
            "name": "Joe Blogger",
            "roles": [{
                "name": "document readers"
            }]
        },
        "document": {
            "ownerName": "Joe Blogger",
            "classificationLevel": 4
        }
    }
}

test_document_access_class_level_equal_1 {
    allow with input as {
        "user": {
            "name": "Joe Blogger",
            "roles": [{
                "name": "document readers"
            }]
        },
        "document": {
            "classificationLevel": 1,
            "ownerName": "Joe Blogger"
        }
    }
}

test_document_readers_cannot_access_others_documents {
    not allow with input as {
        "user": {
            "name": "Joe Blogger",
            "roles": [{
                "name": "document readers"
            }]
        },
        "document": {
            "classificationLevel": 1,
            "ownerName": "Mike Blogger"
        }
    }
}
