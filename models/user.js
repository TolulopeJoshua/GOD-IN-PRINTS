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
    gender: { type: String, enum: ['male', 'female', '', 'undefined'], },
    loginType: { type: String, enum: ['password', 'facebook', 'google'], required: true, },
    facebookId: { type: String },
    googleId: { type: String },
    referrer: { type: String },
    resetCode: { type: String, default: null }, 
    subscription: { status: {type: String, default: 'classic'}, expiry: Date, autorenew: Boolean, code: {type: String, default: ''}, curr: {type: String, default: ''} },
    admin: { type: Number, default: 0 },
    adminToken: { hash: {type: String, default: ''}, expiry: {type: Date, default: null}},
    dateTime: { type: Date, default: new Date() },
    lastLogin: { type: Date, default: new Date() },
    reviews: [ { type: Schema.Types.ObjectId, ref: 'Review' } ],
    downloads: [ { bookId: { type: Schema.Types.ObjectId, ref: 'Book' }, downloadTime: Date, } ], 
    tktdownloads: [ { bookId: { type: Schema.Types.ObjectId, ref: 'Book' }, downloadTime: Date, } ], 
    watchLater: [ { type: String } ],
    isApproved: { type: Boolean, default: true },
    preferences: { nomail: {set: {type: Boolean, default: false}, time: Date}, },
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);