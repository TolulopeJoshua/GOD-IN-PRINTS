const mongoose = require('mongoose');
const { string } = require('sharp/lib/is');
const Schema = mongoose.Schema;
// const Review = require('./review')

const opts = {toJSON: {virtuals: true}};

const BookScema = new Schema({
    title: String,
    author: String,
    // keywords: String,
    filetype: string,
    image: {
        key: String,
    },
    document: {
        key: String,
        size: Number
    },
    datetime: {
        type: Date,
        default: new Date(2022, 03, 15)
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
    }
}, opts);

// CampgroundScema.virtual('properties.popUpMarkup').get(function () {
//     return `<strong><a href='/campgrounds/${this._id}'>${this.title}</a></strong>
//             <p>${this.description.substring(0,20)}...</p>`
// });

// BookScema.post('findOneAndDelete', async function (doc) {
//     if (doc) {
//         await Review.deleteMany({
//             _id: {
//                 $in: doc.reviews
//             }
//         })
//     }
// })

module.exports = mongoose.model('Book', BookScema);