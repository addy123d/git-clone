const mongo = require("mongoose");
const schema = mongo.Schema;


const userSchema = new schema({
    name: {
        type: String,
        required: true
    },
    username: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true
    },
    password: {
        type: String,
        required: true
    },
    contact: {
        type: String,
        required: true
    },
    timeStamp: {
        type: String,
        required: true
    },
    logs: {
        type: [Object],
        required: true
    }
})

module.exports = User = mongo.model("user", userSchema);