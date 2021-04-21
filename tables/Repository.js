const mongo = require("mongoose");
const schema = mongo.Schema;


const repositorySchema = new schema({
    username: {
        type: String,
        required: true
    },
    // reponame : {
    //     type : String,
    //     required: true
    // },
    // repoDesc : {
    //     type : String,
    //     required: true
    // },
    // createdAt:{
    //     type : String,
    //     required: true
    // }
    repoDetails: {
        type: [Object],
        required: true
    }
})

module.exports = Repository = mongo.model("repository", repositorySchema);