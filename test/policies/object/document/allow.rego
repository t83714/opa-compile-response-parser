package object.document

default allow = false

allow {
    input.user.roles[_].name = "admin"
}

allow {
    input.user.roles[_].name = "document readers"
    input.document.ownerName = input.user.name
    input.document.classificationLevel <= 3
}

allow {
    input.user.roles[_].name = "document power readers"
    input.document.classificationLevel <= 9
}