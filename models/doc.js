const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review')


const DocSchema = new Schema({
    name: {
        type: String,
        required: true
    },
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
    text: {
        type: String
    },
    content: {
        type: String,
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
        default: new Date()
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
    },
})

DocSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})


module.exports = mongoose.model('Doc', DocSchema);

