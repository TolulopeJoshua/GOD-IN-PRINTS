const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const Review = require('./review')

const opts = {toJSON: {virtuals: true}};

const BookScema = new Schema({
    title: {
        type: String,
        required: true,
        unique: true
    },
    uid: {
        type: String,
        required: true,
    },
    author: {
        type: String,
        default: ' '
    },
    // keywords: String,
    filetype: {
        type: String,
        default: 'pdf'
    },
    image: {
        key: {
            type: String,
            default: 'none'
        },
        480: {
            type: String,
            default: 'none'
        },
        160: {
            type: String,
            default: 'none'
        },
        // previews: [
        //     { type: String, }
        // ],
    },
    document: {
        key: String,
        size: Number
    },
    affiliates: { amazon: { type: String, } },
    datetime: {
        type: Date,
        default: new Date()
    },
    contributor: {
        type: Schema.Types.ObjectId,
        ref: 'User'
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    isApproved: {
        type: Boolean,
        default: false
    },
}, opts);

// CampgroundScema.virtual('properties.popUpMarkup').get(function () {
//     return `<strong><a href='/campgrounds/${this._id}'>${this.title}</a></strong>
//             <p>${this.description.substring(0,20)}...</p>`
// });

BookScema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Book', BookScema);