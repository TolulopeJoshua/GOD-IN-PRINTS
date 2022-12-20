const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reviewSchema = new Schema({
    text:  { type: String, required: true, },
    info:  { type: String },
    category: {
        type: String,
        enum: ['Books', 'Biographies', 'Articles', 'Bible', 'Review', 'Suggest', 'media/movies'],
        required: true,
    },
    parentId: {
        type: String,
        required: true,
    },
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    dateTime: {
        type: Date, 
        default: new Date()
    },
    likes: [
        {
            type: Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    comments: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
});

module.exports = mongoose.model("Review", reviewSchema);