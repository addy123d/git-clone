const mongo = require("mongoose");
const schema = mongo.Schema;


const repositorySchema = new schema({
    username: {
        type: String,
        required: true
    },
    repoDetails: {
        type: [Object],
        required: true
    }
})

module.exports = Repository = mongo.model("repository", repositorySchema);