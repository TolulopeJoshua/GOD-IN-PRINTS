const mongoose = require('mongoose');
const Schema = mongoose.Schema;
// const Review = require('./review')

const opts = {toJSON: {virtuals: true}};

const BookScema = new Schema({
    title: String,
    author: String,
    keywords: String,
    contributor: { type: String, default: 'God-in-prints' },
    filetype: { type: String, default: '.pdf' },
    image: {
        key: String,
        folder: String,
    },
    document: {
        key: String,
        size: Number,
        folder: String,
    },
    datetime: {
        type: Date, 
        enum: Date.now(),
        default: new Date(2022, 02, 25)
    },
    // contributor: {
    //     type: Schema.Types.ObjectId,
    //     ref: 'User'
    // },
    // reviews: [
    //     {
    //         type: Schema.Types.ObjectId,
    //         ref: 'Review'
    //     }
    // ]
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