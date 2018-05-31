var mongoose = require('mongoose');
var Schema = mongoose.Schema;

// Messaging between 2 users
var schema = new Schema({
    messages: [],
    created: { type: Date, default: Date.now },
    initiatorRead: { type: Boolean, default: false },
    initiatedRead: { type: Boolean, default: false },
    initiator: { type: Schema.Types.ObjectId, ref: 'User' },
    initiated: { type: Schema.Types.ObjectId, ref: 'User' }
}, { usePushEach: true} );

module.exports = mongoose.model('Message', schema);