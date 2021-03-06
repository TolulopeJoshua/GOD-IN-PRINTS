const mongoose = require('mongoose');
const Schema = mongoose.Schema;


const DocSchema = new Schema({
    name: String,
    role: String,
    birthYear: Number,
    deathYear: Number,
    gender: {
        type: String,
        enum: ['male', 'female']
    },
    story: {
        type: String
    },
    source: {
        type: String,
        default: 'Anonymous'
    },
    image: {
            key: {type: String, default: "none"},
    },
    docType: {
        type: String,
        enum: ['biography', 'article', 'quote']
    },
    dateTime: {
        type: Date, 
        default: new Date(2022, 02, 25)
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    contributor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    isApproved: {
        type: Boolean,
        default: false
    }
})


module.exports = mongoose.model('Doc', DocSchema);

