const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    firstName: {
        type: String,
        required: true,
    },
    lastName: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        unique: true,
        required: true,
    },
    loginType: {
        type: String,
        enum: ['password', 'facebook', 'google'],
        required: true,
    },
    facebookId: {
        type: String
    },
    googleId: {
        type: String
    },
    resetCode: {
        type: String,
        default: null
    },
    status: {
        type: String,
        default: 'classic'
    },
    dateTime: {
        type: Date, 
        default: new Date()
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    downloads: [
        {
            bookId: Schema.Types.ObjectId,
            downloadTime: Date,
        }
    ],
    
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);