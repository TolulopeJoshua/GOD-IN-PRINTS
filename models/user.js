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
        required: true,
        unique: true
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
    lastDownloadTime: {
        type: Date,
        default: (new Date().getTime() - (24 * 60 * 60 * 1000))
    }
    
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);