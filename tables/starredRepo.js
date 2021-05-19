const mongo = require("mongoose");
const schema = mongo.Schema;


const starSchema = new schema({
    username: {
        type: String,
        required: true
    },
    repoName: {
        type: [String],
        required: true
    }
})

module.exports = Star = mongo.model("star", starSchema);