const { boolean } = require('joi');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    firstName: { type: String, required: true, },
    lastName: { type: String, required: true, },
    email: { type: String, unique: true, required: true, },
    username: { type: String, unique: true, },
    phone: { type: String },
    address: { type: String },
    gender: { type: String, enum: ['male', 'female', ''], },
    loginType: { type: String, enum: ['password', 'facebook', 'google'], required: true, },
    facebookId: { type: String },
    googleId: { type: String },
    resetCode: { type: String, default: null }, 
    subscription: { status: String, expiry: Date, autorenew: Boolean, code: {type: String, default: ''} },
    dateTime: { type: Date, default: new Date() },
    lastLogin: { type: Date, default: new Date() },
    reviews: [ { type: Schema.Types.ObjectId, ref: 'Review' } ],
    downloads: [ { bookId: { type: Schema.Types.ObjectId, ref: 'Book' }, downloadTime: Date, } ], 
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);