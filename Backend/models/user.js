var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var mongooseUniqueValidator = require('mongoose-unique-validator');

var schema = new Schema({
    nickName: { type: String, required: true, unique: true },
    chatNickName: { type: String, unique: true },
    firstName: { type: String },
    lastName: { type: String },
    shortMessage: { type: String },
    bio: { type: String },
    profilePicture: { type: String },
    images: [{ type: String }],
    coverImage: { type: String },
    birthday: { type: Date },
    jobStatus: { type: String },
    education: { type: String },
    password: { type: String, required: true },
    passwordReset: { type: String },
    email: { type: String, required: true, unique: true },
    posts: [{ type: Schema.Types.ObjectId, ref: 'Post' }], // An array of message IDs
    following: [{
        friend: { type: Schema.Types.ObjectId, ref: 'User' },
        nickName: String,
        accepted: Boolean,
        date: { type: Date, default: Date.now }
    }],
    groups: [{
        groupName: { type: String },
        friends: [{ type: String }]
    }],
    inbox: [{
        action: { type: String }, // like, dislike, share, comment
        post: { type: Schema.Types.ObjectId, ref: 'Post' },
        data: { type: Object },
        user: { type: Schema.Types.ObjectId, ref: 'User' },
        date: { type: Date }
    }],
    bannedChat: {
        isBanned: { type: Boolean }, // Will be banned from all chat activities
        days: { type: Number },
        banDate: { type: Date, default: Date.now }
    },
    complaintInbox: [{
        complaint: { type: Object }
    }],
    credit: { type: Number },
    status: { type: String }, // admin, etc.
    twitterLink: { type: String },
    youtubeLink: { type: String },
    linkedinLink: { type: String },
    googleplusLink: { type: String },
    snapchatLink: { type: String },
    instagramLink: { type: String },
    interaction: [{type: Date }]
}, { usePushEach: true });

schema.plugin(mongooseUniqueValidator); // makes sure unique is unique
module.exports = mongoose.model('User', schema);