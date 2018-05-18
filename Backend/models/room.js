var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var schema = new Schema({
    name: { type: String },
    rules: { type: String },
    mods: [{ type: String }]
});

module.exports = mongoose.model('Room', schema);