const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const passportLocalMongoose = require('passport-local-mongoose');

const UserSchema = new Schema({
    firstName: String,
    lastName: String,
    email: {
        type: String,
        required: true,
        unique: true
    },
    status: {
        type: String,
        default: 'classic'
    },
    dateTime: {
        type: Date, 
        default: new Date()
    },
    bibleNotes: [
        {
            chapter: String,
            note: {
                type: Schema.Types.ObjectId,
                ref: 'Review'
            }
        }
    ],
    
});

UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model('User', UserSchema);